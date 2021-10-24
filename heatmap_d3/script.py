import csv
import statistics

data = {}

with open('CityX_temp_daily.csv', newline='') as csvfile:
	# spamreader = csv.reader(csvfile, delimiter=' ', quotechar='|')
	# 	for row in spamreader:
	# 	print(', '.join(row))
	reader = csv.DictReader(csvfile)
	for row in reader:
		cur_date = row['date']
		cur_month_list = cur_date.split('-')
		cur_month = cur_month_list[0] + '-' + cur_month_list[1]

		if cur_month in data:
			data[cur_month][0].append(int(row['max_temperature'])) 
			data[cur_month][1].append(int(row['min_temperature']))
		else:
			data[cur_month] = [[int(row['max_temperature'])],[int(row['min_temperature'])]] 

	for cur_month in data:
		data[cur_month] = [round(statistics.mean(data[cur_month][0]), 2), round(statistics.mean(data[cur_month][1]), 2)]

	print(data)

print('\n.....done.....')

# ------------------------- Getting avg per year by month ------------------------ #

with open('CityX_temp_monthly.csv','w', newline='') as csvfile:
	fieldnames = ['date', 'max_temperature', 'min_temperature']
	writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
	writer.writeheader()

	for cur_month in data:
		writer.writerow({'date': cur_month, 'max_temperature': data[cur_month][0], 'min_temperature': data[cur_month][1]})

# ------------------------- FURTHER EDA to separate out month and year ------------------------ #
# ------------------------- For instance, 1997-01 will be separated out to year: 2997, month: 01 ------------------------ #
with open('CityX_temp_monthly_final.csv','w', newline='') as csvfile:
	fieldnames = ['year', 'month', 'max_temperature', 'min_temperature']
	writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
	writer.writeheader()

	# year will always be first 4 characters, month will always be last 2 characters -> Both retrived by slicing
	for cur_month in data:
		writer.writerow({'year': cur_month[:4], 'month': cur_month[-2:], 'max_temperature': data[cur_month][0], 'min_temperature': data[cur_month][1]})

	# writer.writerow({'year': 2018, 'month': 1, 'max_temperature': 0, 'min_temperature': 0, 'avg_temperature': 0})