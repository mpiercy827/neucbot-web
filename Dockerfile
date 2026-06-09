# neucbot build stage
FROM python:3.14-slim AS neucbot

RUN apt-get -y update \
  && apt-get -y install git

WORKDIR /

ENV NEUCBOT_GIT_SHA="50a0b5611f71bc45f59baea663825854bb13eaed"
RUN git clone https://github.com/shawest/neucbot

WORKDIR /neucbot

RUN git checkout $NEUCBOT_GIT_SHA

# Setup virtual env
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN pip install --no-cache-dir -r requirements.txt

# # neucbot-web build stage
FROM python:3.14-slim

ENV SLIM_TALYS_VERSION=0.0.1

RUN apt-get -y update \
  && apt-get -y install wget

WORKDIR /neucbot-web

# Copy venv from neucbot image
COPY --from=neucbot /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy relevant neuCBOT file
COPY --from=neucbot /neucbot/neucbot/ ./neucbot
COPY --from=neucbot /neucbot/AlphaLists/ ./AlphaLists
COPY --from=neucbot /neucbot/Chains/ ./Chains
COPY --from=neucbot /neucbot/Data/ ./Data
COPY --from=neucbot /neucbot/Materials/ ./Materials

# Download TALYS-slim data
RUN wget https://github.com/mpiercy827/talys_slim/archive/refs/tags/v${SLIM_TALYS_VERSION}.tar.gz
RUN tar -xvzf v${SLIM_TALYS_VERSION}.tar.gz
RUN mv talys_slim-${SLIM_TALYS_VERSION}/TalysSlim ./Data/
RUN rm -rf v${SLIM_TALYS_VERSION}.tar.gz talys_slim-${TALYS_VERSION}/

# Copy over app files
COPY ./app ./app

EXPOSE $PORT

CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
