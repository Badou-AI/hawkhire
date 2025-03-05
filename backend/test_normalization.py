from app.jobs.batch_processor import BatchProcessor

def main():
    processor = BatchProcessor()
    result = processor._test_normalization()
    print(result)

if __name__ == "__main__":
    main() 