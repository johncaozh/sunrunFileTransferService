From node:8.9.3

#Install global pm2
#Run npm install pm2 -g

#Create app directory
RUN mkdir -p /usr/src/service
WORKDIR /usr/src/service

#Install app dependencies
COPY package.json /usr/src/service/
RUN npm install
COPY . /usr/src/service

# ENV NODE_ENV dev

# RUN ["chmod", "+x", "/usr/src/service/docker_start.sh"]
# CMD /bin/bash /usr/src/service/docker_start.sh $NODE_ENV

EXPOSE 3000

CMD ["node","/usr/src/service/app.js"]