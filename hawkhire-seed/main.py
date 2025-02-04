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
    MOCK_BATCH_SIZE,
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL
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

    async def initialize(self):
        """Initialize orchestrator components"""
        await self.storage.initialize()

    async def generate_all(self):
        """Generate complete mock dataset"""
        try:
            print("\n=== Starting Mock Data Generation ===\n")
            start_time = datetime.now()

            # Initialize components
            await self.initialize()

            # Generate organizations first
            print("Generating Organizations...")
            await self.generate_organizations()

            # Generate organization members (skipping candidates for now)
            print("\nGenerating Organization Members...")
            await self.generate_users()

            # Generate jobs for organizations
            print("\nGenerating Jobs...")
            await self.generate_jobs()

            # Generate resumes as direct submissions
            print("\nGenerating Resume Submissions...")
            await self.generate_resume_submissions()

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
        """Generate one admin member per organization"""
        with tqdm(total=len(self.organizations), desc="Org Admins") as pbar:
            for org in self.organizations:
                # Generate one admin member per organization
                user = await self.user_generator.generate_user(user_type='organization')
                if user:
                    member = self.org_generator.generate_organization_member(
                        org['id'],
                        user['id'],
                        role='admin'  # Set as admin
                    )
                    self.org_generator.save_batch([member], table='organization_members')
                    self.users.append(user)
                pbar.update(1)
                # Add delay between user creations to avoid rate limits
                await asyncio.sleep(2)  # 2 second delay

    async def generate_jobs(self):
        """Generate jobs for organizations"""
        with tqdm(total=len(self.organizations), desc="Organizations") as pbar:
            for org in self.organizations:
                # Generate 2-4 jobs per organization
                jobs = self.job_generator.generate_jobs_for_organization(
                    org['id'],
                    min_jobs=2,
                    max_jobs=4
                )
                self.jobs.extend(jobs)
                pbar.update(1)

    async def generate_resume_submissions(self):
        """Generate direct resume submissions for jobs without requiring candidate accounts"""
        with tqdm(total=len(self.jobs), desc="Job Applications") as pbar:
            for job in self.jobs:
                # Generate 10-20 resume submissions per job
                num_submissions = random.randint(10, 20)
                batch = []
                
                for _ in range(num_submissions):
                    resume = await self.resume_generator.generate_resume(
                        candidate_id=None,  # No candidate account needed
                        job_id=job['id']
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
        print(f"- Organization Members: {len(self.users)}")
        print(f"- Jobs: {len(self.jobs)}")
        print(f"- Resume Submissions: {len(self.resumes)}")
        print("\nMock data generation completed successfully!")

async def main():
    """Main execution function"""
    orchestrator = MockDataOrchestrator()
    try:
        await orchestrator.initialize()  # Initialize components first
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

