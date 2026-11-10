import csv
import os
from collections import defaultdict

# Check contestants.csv for duplicates and report them in duplicates.cxv, along with 
# a composite row containing the greatest available field values, in duplicates.cxv
def identify_duplicates(input_file, output_file):
    unique_combos = defaultdict(list)
    headers = []
    
    # read the input file and identify duplicates
    with open(input_file, 'r', newline='', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        headers = reader.fieldnames
        for row in reader:
            key = (row['year'], row['to_country_id'], row['performer'])
            unique_combos[key].append(row)
    
    # filter out the duplicates
    duplicates = {key: rows for key, rows in unique_combos.items() if len(rows) > 1}
    
    # write the duplicates to the output file
    with open(output_file, 'w', newline='', encoding='utf-8') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=headers)
        writer.writeheader()
        
        for key, rows in duplicates.items():
            # write original duplicate rows
            for row in rows:
                writer.writerow(row)
            
            # create composite row
            composite_row = {}
            for field in headers:
                # use the first non-empty value found for each field
                composite_row[field] = next((row[field] for row in rows if row[field]), '')
            
            # write a separator row
            writer.writerow({field: '---' for field in headers})
            
            # write the composite row
            writer.writerow(composite_row)
            
            # add a blank row between sets of duplicates for readability
            writer.writerow({field: '' for field in headers})

    return len(duplicates)

# Contestant uids are referenced across files (global rankings, lyrics), so
# every uid must be unique across every contestant file of every contest.
def find_duplicate_uids(files):
    seen = {}
    duplicates = []
    for path in files:
        with open(path, 'r', newline='', encoding='utf-8') as infile:
            for row in csv.DictReader(infile):
                uid = row['id']
                if uid in seen:
                    duplicates.append((uid, seen[uid], os.path.basename(path)))
                else:
                    seen[uid] = os.path.basename(path)
    return duplicates

public_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public')
uid_files = [os.path.join(public_dir, f) for f in ('main.csv', 'mainCurrent.csv', 'asia.csv')]
duplicate_uids = find_duplicate_uids(uid_files)
for uid, first_file, second_file in duplicate_uids:
    print(f"Duplicate uid {uid} in {first_file} and {second_file}")
print(f"Found {len(duplicate_uids)} duplicate uids across {', '.join(os.path.basename(f) for f in uid_files)}")

input_file = '..\\public\\contestants.csv'
output_file = '..\\public\\duplicates.csv'
num_duplicates = identify_duplicates(input_file, output_file)
print(f"Found {num_duplicates} sets of duplicates. Details written to {output_file}")