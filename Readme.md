#Use https://pypi.org/project/docker-windows-volume-watcher/ for Docker Windows volume watcher

#This script can be installed with pip (both Python 2 & 3 are supported).
pip install docker-windows-volume-watcher

#Usage
#Monitor all directory bindings of all containers. The script will listen for container start/stop events and notify all running containers about file changes.
docker-volume-watcher
