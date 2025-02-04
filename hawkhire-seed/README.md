# HawkHire Mock Data Generator

A comprehensive mock data generation system for HawkHire's job board platform. Generates realistic, localized data for organizations, jobs, users, and resumes with proper relationships and storage management.

## Features

- 🌐 Full multilingual support (English/French)
- 🏢 Organization profiles with members and verification
- 💼 Job postings with detailed requirements
- 👥 User profiles for both candidates and organization members
- 📄 Resume generation with file storage
- 🔄 Proper relationships between all entities
- 🧹 Clean up functionality for mock data
- 📊 Progress tracking and summary reporting

## Prerequisites

- Python 3.9+
- Supabase project with database and storage set up
- Sample PDF resumes in the `data/sample_resumes` directory

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/hawkhire-seed.git
cd hawkhire-seed
```

2. Create a virtual environment
```bash
python -m venv venv
source venv/bin/activate # On Windows use `venv\Scripts\activate`
```

3. Install the dependencies
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the root directory with the following variables:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:your-db-password@your-project.supabase.co:5432/postgres

# Mock Data Configuration
MOCK_BATCH_SIZE=50
NUM_ORGANIZATIONS=100
NUM_USERS=200
DEFAULT_MOCK_PASSWORD=TestPass123!
```

## Project Structure
```
hawkhire-seed/
├── config/
│   ├── __init__.py
│   └── settings.py          # Configuration and constants
├── data/
│   ├── __init__.py
│   └── sample_resumes/      # Place sample PDF resumes here
├── generators/
│   ├── __init__.py
│   ├── base.py             # Base generator class
│   ├── organization_generator.py
│   ├── job_generator.py
│   ├── user_generator.py
│   └── resume_generator.py
├── utils/
│   ├── __init__.py
│   ├── database.py         # Database operations
│   └── storage.py          # File storage operations
├── .env
├── main.py                 # Main execution script
└── requirements.txt
```
## Usage

1.	Add sample PDF resumes:
    - Place sample PDF resumes in the data/sample_resumes directory
    - These will be used as templates for generated resume files
2.	Configure generation parameters:
    - Adjust settings in .env file
    - Modify constants in config/settings.py if needed
3.	Run the generator:
```bash
python main.py
```
4.	Monitor the progress:
    - The script provides progress bars for each generation step
    - A summary is displayed upon completion
5.	Clean up mock data (if needed):
```bash
python main.py cleanup
```

## Generated Data

- Organizations: 100
- Jobs: 1000
- Users: 200
- Resumes: 200

- Organizations
    - Company profiles with localized content
    - Member information
    - Verification status
    - Location data
- Jobs
    - Job postings with requirements
    - Salary information
    - Skills and qualifications
    - Location and remote work options
- Users
    - Candidate profiles
    - Organization member accounts
    - Authentication records
    - Profile information
- Resumes
    - PDF files in storage
    - Parsed content
    - Metadata and processing information
    - Job application links

## Development

### Adding New Features

1.	Extend base generator:
```python
from generators.base import BaseGenerator

class YourGenerator(BaseGenerator):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
```
2.	Add new generation methods:
```python
def generate_your_data(self):
    return {
        "field": self.generate_localized_text("your_faker_method")
    }
```

### Running Tests
```bash
python -m pytest tests/
```

### Troubleshooting
- Common Issues
    1.	Database Connection Errors
        - Verify Supabase credentials in .env
        - Check database permissions
    2.	Storage Errors
        - Ensure sample resumes exist
        - Verify storage bucket permissions
    3.	Generation Errors
        - Check batch sizes in .env
        - Monitor database connection stability

### Error Recovery
If generation fails:
1. The script automatically attempts cleanup
2. Run manual cleanup if needed:
```bash
python main.py cleanup
```

### Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

### License
This project is licensed under the MIT License - see the LICENSE file for details.

### Support
For support, please open an issue in the GitHub repository or contact the development team.