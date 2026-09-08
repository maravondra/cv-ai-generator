FROM node:20-slim

# Python toolchain for the generation/rendering scripts that live at the repo root.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-venv python3-pip \
    && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY web/package.json web/package-lock.json ./web/
RUN cd web && npm ci

COPY . .

RUN cd web && npm run build

ENV NODE_ENV=production
ENV PYTHON_BIN=/opt/venv/bin/python3

WORKDIR /app/web
EXPOSE 3000
CMD ["npm", "start"]
