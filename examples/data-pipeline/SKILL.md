---
name: data-pipeline
description: Data processing pipeline with Python and TypeScript
author: Data Team
tags: [data, etl, pipeline, python, typescript]
dependencies:
  - type: npm
    name: pandas
    version: ^2.0.0
  - type: npm
    name: numpy
    version: ^1.24.0
---

# Data Processing Pipeline

This skill demonstrates a complete data processing pipeline with code examples in multiple languages.

## Python Implementation

### Data Loading

\`\`\`python
# @name: load_data
# @param: path - str, path to CSV file
# @returns: DataFrame
import pandas as pd

def load_data(path: str) -> pd.DataFrame:
    """Load data from CSV file"""
    df = pd.read_csv(path)
    print(f"Loaded {len(df)} rows")
    return df
\`\`\`

### Data Cleaning

\`\`\`python
# @name: clean_data
# @param: df - DataFrame
# @returns: DataFrame
def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Clean and preprocess data"""
    # Remove duplicates
    df = df.drop_duplicates()

    # Handle missing values
    df = df.dropna(subset=['id', 'name'])

    # Fill numeric columns with mean
    numeric_cols = df.select_dtypes(include=['number']).columns
    df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())

    return df
\`\`\`

### Data Transformation

\`\`\`python
# @name: transform_data
# @param: df - DataFrame
# @returns: DataFrame
def transform_data(df: pd.DataFrame) -> pd.DataFrame:
    """Apply transformations to data"""
    # Add calculated column
    df['total'] = df['quantity'] * df['price']

    # Normalize dates
    df['date'] = pd.to_datetime(df['date'])

    # Categorize
    df['category'] = df['amount'].apply(categorize_amount)

    return df

def categorize_amount(amount: float) -> str:
    if amount < 100:
        return 'small'
    elif amount < 1000:
        return 'medium'
    else:
        return 'large'
\`\`\`

### Data Export

\`\`\`python
# @name: export_data
# @param: df - DataFrame, output_path - str
# @returns: None
def export_data(df: pd.DataFrame, output_path: str) -> None:
    """Export data to multiple formats"""
    # CSV
    df.to_csv(output_path, index=False)

    # JSON
    json_path = output_path.replace('.csv', '.json')
    df.to_json(json_path, orient='records')

    # Excel
    excel_path = output_path.replace('.csv', '.xlsx')
    df.to_excel(excel_path, index=False)

    print(f"Exported to {output_path}")
\`\`\`

## TypeScript Implementation

### Type Definitions

\`\`\`typescript
// @name: types
// @exports: DataRecord, ProcessingResult
export interface DataRecord {
  id: string;
  name: string;
  quantity: number;
  price: number;
  date: string;
}

export interface ProcessingResult {
  records: DataRecord[];
  total: number;
  categories: Record<string, number>;
}
\`\`\`

### Data Processing

\`\`\`typescript
// @name: processRecords
// @param: records - DataRecord[]
// @returns: ProcessingResult
import _ from 'lodash';

export function processRecords(records: DataRecord[]): ProcessingResult {
  // Calculate total
  const total = _.sumBy(records, r => r.quantity * r.price);

  // Categorize
  const categories = _.countBy(records, r => {
    const amount = r.quantity * r.price;
    if (amount < 100) return 'small';
    if (amount < 1000) return 'medium';
    return 'large';
  });

  return { records, total, categories };
}
\`\`\`

## Usage Example

### Complete Pipeline

\`\`\`python
# @name: run_pipeline
# @param: input_path - str, output_path - str
# @returns: None

# Run the complete pipeline
df = load_data('input.csv')
df = clean_data(df)
df = transform_data(df)
export_data(df, 'output.csv')
\`\`\`

### Setup Commands

\`\`\`bash
$ pip install pandas numpy
$ python pipeline.py
\`\`\`

## Tests

\`\`\`python
import pytest
from pipeline import load_data, clean_data, transform_data

def test_load_data():
    df = load_data('test_data.csv')
    assert len(df) > 0

def test_clean_data():
    df = pd.DataFrame({'id': [1, None], 'name': ['A', 'B']})
    cleaned = clean_data(df)
    assert len(cleaned) == 1

def test_transform_data():
    df = pd.DataFrame({
        'quantity': [10],
        'price': [5.0],
        'amount': [50.0],
        'date': ['2024-01-01']
    })
    result = transform_data(df)
    assert 'total' in result.columns
    assert result['total'].iloc[0] == 50.0
\`\`\`
