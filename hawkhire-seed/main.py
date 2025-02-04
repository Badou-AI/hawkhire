"""
Main execution module for HawkHire mock data generation. Orchestrates the creation of a complete
mock dataset including organizations, jobs, users, and resumes. Handles proper sequencing of data
generation and relationships between entities.
"""

import asyncio
import random
from typing import Dict, List
from datetime import datetime
from tqdm import tqdm

from config.settings import (
    NUM_ORGANIZATIONS,
    NUM_USERS,
    MOCK_BATCH_SIZE
)
from utils.database import DatabaseManager
from utils.storage import StorageManager
from generators.organization_generator import OrganizationGenerator
from generators.job_generator import JobGenerator
from generators.user_generator import UserGenerator
from generators.resume_generator import ResumeGenerator

class MockDataOrchestrator:
    def __init__(self):
        self.db = DatabaseManager()
        self.storage = StorageManager()
        
        # Initialize generators
        self.org_generator = OrganizationGenerator(self.db, self.storage)
        self.job_generator = JobGenerator(self.db, self.storage)
        self.user_generator = UserGenerator(self.db, self.storage)
        self.resume_generator = ResumeGenerator(self.db, self.storage)
        
        # Track generated data
        self.organizations: List[Dict] = []
        self.jobs: List[Dict] = []
        self.users: List[Dict] = []
        self.resumes: List[Dict] = []
        
        self.batch_id = self.org_generator.mock_batch_id

    async def generate_all(self):
        """Generate complete mock dataset"""
        try:
            print("\n=== Starting Mock Data Generation ===\n")
            start_time = datetime.now()

            # Generate organizations first
            print("Generating Organizations...")
            await self.generate_organizations()

            # Generate users (both candidates and organization members)
            print("\nGenerating Users...")
            await self.generate_users()

            # Generate jobs for organizations
            print("\nGenerating Jobs...")
            await self.generate_jobs()

            # Generate resumes and applications
            print("\nGenerating Resumes and Applications...")
            await self.generate_resumes()

            end_time = datetime.now()
            duration = end_time - start_time

            # Print summary
            self.print_generation_summary(duration)

        except Exception as e:
            print(f"\nError during data generation: {e}")
            await self.cleanup()
            raise

    async def generate_organizations(self):
        """Generate organization data"""
        with tqdm(total=NUM_ORGANIZATIONS) as pbar:
            for i in range(0, NUM_ORGANIZATIONS, MOCK_BATCH_SIZE):
                batch_size = min(MOCK_BATCH_SIZE, NUM_ORGANIZATIONS - i)
                batch = []
                
                for _ in range(batch_size):
                    org = self.org_generator.generate_organization()
                    batch.append(org)
                    self.organizations.append(org)
                
                self.org_generator.save_batch(batch)
                pbar.update(batch_size)

    async def generate_users(self):
        """Generate user data including both candidates and organization members"""
        # Generate candidate users
        num_candidates = NUM_USERS
        with tqdm(total=num_candidates, desc="Candidates") as pbar:
            for i in range(0, num_candidates, MOCK_BATCH_SIZE):
                batch_size = min(MOCK_BATCH_SIZE, num_candidates - i)
                batch = []
                
                for _ in range(batch_size):
                    user = await self.user_generator.generate_user(user_type='candidate')
                    if user:
                        batch.append(user)
                        self.users.append(user)
                
                if batch:
                    self.user_generator.save_batch(batch)
                pbar.update(batch_size)

        # Generate organization members
        print("\nGenerating Organization Members...")
        with tqdm(total=len(self.organizations), desc="Org Members") as pbar:
            for org in self.organizations:
                # Generate 1-5 members per organization
                num_members = random.randint(1, 5)
                batch = []
                
                for _ in range(num_members):
                    user = await self.user_generator.generate_user(user_type='organization')
                    if user:
                        member = self.org_generator.generate_organization_member(
                            org['id'],
                            user['id']
                        )
                        batch.append(member)
                
                if batch:
                    self.org_generator.save_batch(batch, table='organization_members')
                pbar.update(1)

    async def generate_jobs(self):
        """Generate jobs for organizations"""
        with tqdm(total=len(self.organizations), desc="Organizations") as pbar:
            for org in self.organizations:
                # Generate 1-5 jobs per organization
                jobs = self.job_generator.generate_jobs_for_organization(
                    org['id'],
                    min_jobs=1,
                    max_jobs=5
                )
                self.jobs.extend(jobs)
                pbar.update(1)

    async def generate_resumes(self):
        """Generate resumes for candidates"""
        # Filter candidate users
        candidates = [u for u in self.users if u.get('user_type') == 'candidate']
        
        with tqdm(total=len(candidates), desc="Resumes") as pbar:
            for candidate in candidates:
                # Generate 1-3 resumes per candidate
                num_resumes = random.randint(1, 3)
                batch = []
                
                for _ in range(num_resumes):
                    # Randomly associate with a job or leave as general resume
                    job_id = random.choice(self.jobs)['id'] if random.random() > 0.5 else None
                    
                    resume = await self.resume_generator.generate_resume(
                        candidate['id'],
                        job_id
                    )
                    if resume:
                        batch.append(resume)
                        self.resumes.append(resume)
                
                if batch:
                    self.resume_generator.save_batch(batch)
                pbar.update(1)

    async def cleanup(self):
        """Clean up all mock data if generation fails"""
        print("\nCleaning up mock data...")
        await self.resume_generator.cleanup_mock_resumes()
        await self.user_generator.cleanup_mock_users()
        self.job_generator.cleanup_mock_data()
        self.org_generator.cleanup_mock_data()

    def print_generation_summary(self, duration):
        """Print summary of generated data"""
        print("\n=== Mock Data Generation Summary ===")
        print(f"Batch ID: {self.batch_id}")
        print(f"Duration: {duration}")
        print("\nGenerated Data:")
        print(f"- Organizations: {len(self.organizations)}")
        print(f"- Jobs: {len(self.jobs)}")
        print(f"- Users: {len(self.users)}")
        print(f"- Resumes: {len(self.resumes)}")
        print("\nMock data generation completed successfully!")

async def main():
    """Main execution function"""
    orchestrator = MockDataOrchestrator()
    try:
        await orchestrator.generate_all()
    except KeyboardInterrupt:
        print("\nGeneration interrupted by user.")
        await orchestrator.cleanup()
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        await orchestrator.cleanup()
        raise

if __name__ == "__main__":
    asyncio.run(main())
