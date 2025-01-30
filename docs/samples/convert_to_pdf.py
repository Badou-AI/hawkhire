import markdown
from weasyprint import HTML
import os

def convert_md_to_pdf(md_file, pdf_file):
    # Read markdown content
    with open(md_file, 'r', encoding='utf-8') as f:
        md_content = f.read()
    
    # Convert markdown to HTML
    html_content = markdown.markdown(md_content)
    
    # Add some basic styling
    styled_html = f"""
    <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                h1 {{ color: #2c3e50; }}
                h2 {{ color: #34495e; border-bottom: 1px solid #eee; }}
                h3 {{ color: #34495e; }}
                a {{ color: #3498db; }}
                li {{ margin: 5px 0; }}
            </style>
        </head>
        <body>
            {html_content}
        </body>
    </html>
    """
    
    # Convert HTML to PDF
    HTML(string=styled_html).write_pdf(pdf_file)

if __name__ == "__main__":
    # Convert resume
    convert_md_to_pdf('sample_resume.md', 'sample_resume.pdf')
    print("Resume converted to PDF successfully!")
    
    # Convert job description
    convert_md_to_pdf('sample_job_description.md', 'sample_job_description.pdf')
    print("Job description converted to PDF successfully!") 