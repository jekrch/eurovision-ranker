import pandas as pd
import os

def split_eurovision_csv(input_file, main_output_file, lyrics_output_file):
    """
    split contestant.csv into two files for better performance/efficiency:
    1. Main file with all columns except lyrics
    2. Lyrics file with id, year, and lyrics columns only
    
    params:
    input_file (str): Path to input CSV file
    main_output_file (str): Path to save main data without lyrics
    lyrics_output_file (str): Path to save lyrics data
    """
    
    df = pd.read_csv(input_file, encoding='utf-8', on_bad_lines='warn')
    
    # create lyrics DataFrame with only id, year, and lyrics columns
    lyrics_columns = ['id', 'year', 'lyrics', 'eng_lyrics']
    lyrics_df = df[lyrics_columns].fillna('')  # fill missing values with empty string
    
    # create main DataFrame excluding lyrics columns
    main_columns = [col for col in df.columns if col not in ['lyrics', 'eng_lyrics']]
    main_df = df[main_columns].fillna('')  # fill missing values with empty string
    
    # save new csv files
    main_df.to_csv(main_output_file, index=False, encoding='utf-8')
    lyrics_df.to_csv(lyrics_output_file, index=False, encoding='utf-8')
    
    print(f"Original CSV shape: {df.shape}")
    print(f"Main file shape: {main_df.shape}")
    print(f"Lyrics file shape: {lyrics_df.shape}")
    
    return main_df, lyrics_df

if __name__ == "__main__":
    input_file = os.path.join("..", "public", "contestants.csv")
    main_output = os.path.join("..", "public", "main.csv")
    lyrics_output = os.path.join("..", "public", "lyrics.csv")
    
    main_data, lyrics_data = split_eurovision_csv(input_file, main_output, lyrics_output)