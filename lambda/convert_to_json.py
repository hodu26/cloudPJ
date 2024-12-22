import pandas as pd

def excel_to_json(excel_file_path, sheet_name=None, output_json_path="output.json"):
    """
    Convert an Excel file to a JSON file.

    :param excel_file_path: Path to the Excel file to convert.
    :param sheet_name: Sheet name to convert. If None, the first sheet is used.
    :param output_json_path: Path to save the converted JSON file.
    """
    try:
        # Read the Excel file
        if sheet_name:
            df = pd.read_excel(excel_file_path, sheet_name=sheet_name, engine="openpyxl")
        else:
            df = pd.read_excel(excel_file_path, engine="openpyxl")  # Default to the first sheet

        # Save as JSON
        df.to_json(output_json_path, orient='records', force_ascii=False, indent=4)
        print(f"Successfully converted to {output_json_path}")
    except Exception as e:
        print(f"Error occurred: {e}")

# Example usage
excel_to_json("courses.xlsx", sheet_name="Sheet1", output_json_path="courses.json")
