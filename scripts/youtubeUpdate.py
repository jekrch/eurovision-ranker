import csv
import json
import os

def update_csv_with_json(csv_file, json_file, output_file):
    try:
        # Read the JSON file
        with open(json_file, 'r', encoding='utf-8') as f:
            json_data = json.load(f)
        
        # Create a dictionary for quick lookup
        youtube_lookup = {(item['countryKey'], item['artist']): item['youtube'] 
                          for item in json_data['cache']}
        
        # Read the CSV file and write to a new file
        with open(csv_file, 'r', encoding='utf-8') as csv_in:
            reader = csv.reader(csv_in)
            
            # Read the first row to get the fieldnames
            fieldnames = next(reader, None)
            
            if fieldnames is None:
                print("Error: CSV file is empty")
                return
            
            print("CSV Fieldnames:", fieldnames)
            
            if 'youtube_url' not in fieldnames:
                fieldnames.append('youtube_url')
            
            with open(output_file, 'w', newline='', encoding='utf-8') as csv_out:
                writer = csv.DictWriter(csv_out, fieldnames=fieldnames)
                writer.writeheader()
                
                updated_count = 0
                for row_num, row in enumerate(reader, start=2):  # start=2 because row 1 is headers
                    if len(row) != len(fieldnames):
                        print(f"Warning: Row {row_num} has {len(row)} fields, expected {len(fieldnames)}")
                        #print(f"Row content: {row}")
                        #continue
                    
                    row_dict = dict(zip(fieldnames, row))
                    country_key = row_dict.get('to_country_id', '')
                    artist = row_dict.get('performer', '')
                    
                    # Check if there's a match in the JSON data
                    if (country_key, artist) in youtube_lookup:
                        row_dict['youtube_url'] = youtube_lookup[(country_key, artist)]
                        updated_count += 1
                    
                    writer.writerow(row_dict)
            
        print(f"CSV update completed successfully. {updated_count} rows were updated.")
    except FileNotFoundError as e:
        print(f"Error: File not found. {e}")
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON file - {json_file}")
    except csv.Error as e:
        print(f"CSV Error: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        import traceback
        traceback.print_exc()

# Usage
csv_file = '..\\public\\contestants.csv'
json_file = '\\etc\\contestants.json'
output_file = '..\\public\\contestants_updated.csv'

# Ensure the output directory exists
os.makedirs(os.path.dirname(output_file), exist_ok=True)

update_csv_with_json(csv_file, json_file, output_file)