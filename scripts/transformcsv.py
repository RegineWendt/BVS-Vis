#!/usr/bin/env python
# This Python script compresses data from the ns-3-blood-module
import time
import sys
from collections import OrderedDict

mapOfAllValues = OrderedDict()
lasttimestamp = ""
timestampcounter = -1


# process incomming data
def process_line(i, line):
    temp = line.split(",")
    if i % 1000000 == 0:
        print(str(i) + " processed lines")
    # process lines with correct size
    if len(temp) >= 7:
        return [temp[0], temp[1], temp[2], temp[3], temp[4], temp[5], temp[6]]


# insert a dataset into a map
# Array: data array from csv file
# digits: The number of decimals to use when rounding the number.
def insert_into_map(array, digits,f):
    if array is not None:
        if len(array) > 4:
            global timestampcounter
            global lasttimestamp
            if lasttimestamp != array[4]:
                # wenn neuer Timestamp, dann Map schreiben und leeren
                print("Write Timestamp:" + lasttimestamp)
                write_file(f)
                # Danach timestamp umsetzen und wetier
                lasttimestamp = array[4]
                timestampcounter += 1
            x = round(float(array[1]), digits)
            y = round(float(array[2]), digits)
            z = round(float(array[3]), digits)
            key = str(x) + "," + str(y) + "," + str(z) + "," + str(timestampcounter)
            value = 1
            if key in mapOfAllValues:
                value = mapOfAllValues[key] + 1
            mapOfAllValues[key] = value


# read a file
# filepath: path to file
# digits: The number of decimals to use when rounding the number. (see insert_into_map())
def read_write_file(filepath, digits, f):
    # Read in the file
    data = []
    print("Reading file")
    fp = open(filepath, 'r')
    i = 0
    for i, line in enumerate(fp):
        insert_into_map(process_line(i, line), digits,f)
    print(str(i) + " rows loaded")
    fp.close()
    return data


# write a file
# file: (path and) filename to put compressed data in 
def write_file(f):
    # Write the file out again
    for k, v in mapOfAllValues.items():
        f.write(str(v) + "," + k + "\n")
    mapOfAllValues.clear()
    


# Main Method, starts processing and counts time
def main(sysargs):
    print("Compressing csvNano.csv")
    start = time.time()
    arglenght = len(sysargs) - 1
    accuracy = 1
    if arglenght == 1:
        accuracy = sysargs[1]
    # Datei oeffnen
    f = open("csvNanoNew.csv", 'w')
    read_write_file("csvNano.csv", int(accuracy),f)
    print("Reading done: " + str(round((time.time() - start) / 60, 2)) + " Minutes")
    # Datei schliessen
    f.close()
    end = time.time()
    print("Runtime: " + str(round((end - start) / 60, 2)) + " Minutes")


# Starts Program
main(sys.argv)
