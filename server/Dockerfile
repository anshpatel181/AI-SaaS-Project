# 1. Start with a lightweight Linux box that already has Node.js v20 installed
FROM node:20-alpine

# 2. Create a folder inside the box called /app and move inside it
WORKDIR /app

# 3. Copy only the package.json files first (this makes building much faster)
COPY package*.json ./

# 4. Install all the dependencies inside the box
RUN npm install

# 5. Copy your Prisma schema folder into the box
COPY prisma ./prisma/

# 6. Generate the Prisma Client so it works on Linux
RUN npx prisma generate

# 7. Copy the rest of your server code into the box
COPY . .

# 8. Tell the box to open port 3000 to the outside world
EXPOSE 3000

# 9. The command to start the server when the box is turned on
CMD ["npm", "run", "start"]
