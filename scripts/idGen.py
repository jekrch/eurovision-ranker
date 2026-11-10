import csv
import string
import itertools

## generate unique 3 character alphanumeric codes for all contest songs in contestants.csv

def generate_codes(start_after=None):
    """Yield codes in order. Pass the highest uid already in use (across every
    contestant file, e.g. main.csv, mainCurrent.csv and asia.csv) as
    start_after so new rows continue the sequence instead of restarting at aaa."""
    characters = string.ascii_lowercase + string.digits
    started = start_after is None
    for code in itertools.product(characters, repeat=3):
        code = ''.join(code)
        if started:
            yield code
        elif code == start_after:
            started = True

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