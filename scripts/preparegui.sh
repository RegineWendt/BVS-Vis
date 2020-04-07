#!/bin/bash
echo "simulationDuration: $SIMDURATION"
echo "numOfNanobots: $NUMOFNANOBOTS"
echo "injectionVessel: $INJECTVESSEL"
echo "NS-3 Version: $NS3VERS"
echo "Compression: $COMPRESSION"
echo "Accuracy: $ACCURACY"
# Start simulation
cd /usr/ns3/
./waf --run "test-blood-voyager-s --simulationDuration=$SIMDURATION --numOfNanobots=$NUMOFNANOBOTS --injectionVessel=$INJECTVESSEL"
# Compression
if [ $COMPRESSION -gt 0 ]
then
  ./transformcsv.py $ACCURACY
  mv csvNano.csv csvNanoOld.csv
  mv csvNanoNew.csv csvNano.csv
fi
# Moving file to volume
mv csvNano.csv /var/www/csvNano.csv
chmod -R 777 /var/www/
