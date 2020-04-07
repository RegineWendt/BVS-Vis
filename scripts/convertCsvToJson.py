#!/usr/bin/env python
# This Script converts CSV File to a JS Variable with JSON
import csv
import json
import os 

dir_path = os.path.dirname(os.path.realpath(__file__))
print(dir_path)

fieldnames = ("ID","type","x","y","z","x2","y2","z2")
jsonfile = open(dir_path +'/' +'vasculature.js', 'w')
jsonfile.write("vasculature_json = '[")
first = True

with open(dir_path +'/' + "vasculature.csv") as csvfile:
    reader = csv.reader(csvfile, delimiter=',') 
    for row in reader:
        if first: 
            jsonfile.write("{")
            first = False
        else:
             jsonfile.write(",{")
        for x in range(len(fieldnames)):
            jsonfile.write("\""+fieldnames[x] + "\":" + str(row[x]))
            if x + 1 != len(fieldnames):
                jsonfile.write(",")
        jsonfile.write("}")
jsonfile.write("]';")