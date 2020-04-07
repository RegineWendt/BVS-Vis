FROM ubuntu:latest
LABEL maintainer="Regine Wendt <wendt@itm.uni-luebeck.de>"
LABEL Description="Docker image for NS-3 Network Simulator including blood-voyager-s and BVS-Vis"
#Based on https://github.com/ryankurte/docker-ns3

# Install necessary software
RUN apt-get update --fix-missing && apt-get upgrade -y && apt-get install -y \
  wget \
  dos2unix \
  autoconf \
  bzr \
  cvs \
  unrar \
  build-essential \
  clang \
  valgrind \
  gsl-bin \
  libgsl-dev \
  flex \
  bison \
  libfl-dev \
  tcpdump \
  sqlite \
  sqlite3 \
  libsqlite3-dev \
  libxml2 \
  libxml2-dev \
  qtbase5-dev \
  python \
  python-dev \
  cmake \
  libc6-dev \
  libc6-dev-i386 \
  g++-multilib

# Set enviromental variables
#ENV SIMDURATION 30
#ENV NUMOFNANOBOTS 150
#ENV INJECTVESSEL 61
ARG NS3VERSION=3.29
ENV NS3VERS=$NS3VERSION
#ENV COMPRESSION=1
#ENV ACCURACY=1

# NS-3
# Create working directory
RUN mkdir -p /usr/ns3
WORKDIR /usr

# Fetch NS-3 source
RUN wget https://github.com/nsnam/ns-3-dev-git/archive/ns-$NS3VERSION.tar.gz && tar -xf ns-$NS3VERSION.tar.gz
# RUN wget http://www.nsnam.org/release/ns-allinone-$NS3VERSION.tar.gz && tar -xf ns-allinone-$NS3VERSION.tar.gz
RUN mkdir /usr/nm
RUN mv -v /usr/ns-3-dev-git-ns-$NS3VERSION/* /usr/ns3/
# RUN mv -v /usr/ns-allinone-$NS3VERSION/ns-$NS3VERSION/* /usr/ns3/

# add Repository
ADD / /usr/nm
# Add blood-voyager-s
RUN mv -v /usr/nm/blood-voyager-s /usr/ns3/src/
# Configure and compile NS-3
RUN cd /usr/ns3/ && ./waf configure --build-profile=release && ./waf
# Copy Visualizer Files
RUN mkdir /var/www/
RUN mv -v /usr/nm/visualizer/* /var/www/
# Format scripts
RUN dos2unix /usr/nm/scripts/preparegui.sh
RUN dos2unix /usr/nm/scripts/convertCsvToJson.py
RUN dos2unix /usr/nm/scripts/transformcsv.py
RUN chmod 777 /usr/nm/scripts/*
# Create vasculature.js
RUN cd /usr/nm/scripts && ./convertCsvToJson.py
RUN mv -v /usr/nm/scripts/vasculature.js /var/www/vasculature.js
# Copy Default CSV Vasculature
RUN mv -v /usr/nm/scripts/vasculature.csv /usr/ns3/vasculature.csv
# Set up PrepGui script
RUN mv -v /usr/nm/scripts/preparegui.sh /usr/ns3/preparegui.sh
# Set up Python Compression Script
RUN mv -v /usr/nm/scripts/transformcsv.py /usr/ns3/transformcsv.py
# cleanup
RUN apt-get clean && rm -rf /var/lib/apt && rm /usr/ns-$NS3VERSION.tar.gz

# Execute Blood Module
ENTRYPOINT ["/usr/ns3/preparegui.sh"]