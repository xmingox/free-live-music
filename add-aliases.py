import json

# Load current metros
with open('lib/metros.json', 'r') as f:
    data = json.load(f)

# Define city-to-metro mappings (scraped cities → their metro)
aliases_map = {
    'Los Angeles': ['Anaheim', 'Long Beach', 'Santa Ana', 'Glendale', 'Burbank', 'Pasadena', 'Santa Monica', 'Venice'],
    'San Francisco': ['Oakland', 'Berkeley', 'San Jose', 'Santa Cruz', 'San Luis Obispo', 'Santa Barbara', 'Sacramento', 'Stockton', 'Bakersfield', 'Riverside', 'Fresno', 'Irvine'],
    'Dallas': ['Fort Worth'],
    'Houston': ['San Antonio'],
    'Portland': ['Eugene', 'Bend'],
    'Denver': ['Boulder', 'Fort Collins'],
    'Nashville': ['Memphis'],
    'Salt Lake City': ['Moab'],
}

# Add aliases to metros
for metro in data['metros']:
    city = metro['city']
    if city in aliases_map:
        metro['aliases'] = aliases_map[city]
    else:
        metro['aliases'] = []

# Save updated metros
with open('lib/metros.json', 'w') as f:
    json.dump(data, f, indent=2)

print("✅ Added aliases to metros.json")
