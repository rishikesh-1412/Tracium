# Deployment Steps :

1. Login to cluster using tsh (tsh --proxy=va1px02.pubmatic.com ssh -A hdp-edevops@10.145.80.53)

2. Go to root user (sudo su root)

3. cd rishikesh/Deployment/Tracium/

4. Pull the new changes from GIT 
   git pull origin main

## Front-end Deployment

1. Stop the running docker 

    docker ps | grep "tracium-react"

    docker stop <containerId>

    docker rm <containerId>

2. Remove the existing image

    docker images | grep "tracium-react"

    docker rmi -f <imageId>

3. Build new image

    cd client/

    docker build --platform linux/amd64 --build-arg REACT_APP_API_URL=http://10.145.80.53:5000 --build-arg REACT_APP_DISCREPANCY_CHECKER_URL=http://10.145.78.91:8501/ -t docker.pubmatic.com/tracium-react .

4. Run the image

    sudo docker run -d --name tracium-react-container -p 3030:80 docker.pubmatic.com/tracium-react:latest

5. Logs can be seen by command

    sudo docker logs -f tracium-react-container

## Server Deployment

1. Stop the running docker 

    docker ps | grep "tracium-server"

    docker stop <containerId>

    docker rm <containerId>

2. Remove the existing image

    docker images | grep "tracium-server"

    docker rmi -f <imageId>

3. Build new image

    sudo docker build --platform linux/amd64 -t docker.pubmatic.com/tracium-server:latest .

4. Run the image

    sudo docker run -d --name tracium-server-container -p 5000:5000 -e PORT=5000 -e DB_HOST=bigdata.va1.pubmatic.local -e DB_PORT=3306 -e DB_USER=datanode_user -e DB_PASS=09kY3NHs docker.pubmatic.com/tracium-server:latest

5. Logs can be seen by command

    sudo docker logs -f tracium-server-container