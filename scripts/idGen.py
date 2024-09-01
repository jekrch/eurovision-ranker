import csv
import string
import itertools

## generate unique 3 character alphanumeric codes for all contest songs in contestants.csv

def generate_codes():
    characters = string.ascii_lowercase + string.digits
    for code in itertools.product(characters, repeat=3):
        yield ''.join(code)

def add_id_to_csv(input_file, output_file):
    code_generator = generate_codes()
    
    with open(input_file, 'r', newline='', encoding='utf-8') as infile, open(output_file, 'w', newline='', encoding='utf-8') as outfile:
        reader = csv.reader(infile)
        writer = csv.writer(outfile)
        
        # read the header and add the new 'id' column
        header = next(reader)
        header.insert(0, 'id')
        writer.writerow(header)
        
        # process each row, adding the unique code
        for row in reader:
            code = next(code_generator)
            row.insert(0, code)
            writer.writerow(row)

input_file = '..\\public\\contestants.csv'
output_file = '..\\public\\contestants2.csv'
add_id_to_csv(input_file, output_file)