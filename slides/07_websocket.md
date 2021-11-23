# Real-time communication

## connect(token, onAuth, onMessage)
## send(type, data, channel)

# onAuth callback

## (socketToken: string)
## Usually used to join channel(s)

# onMessage callback

## (pl: Payload)
## Used to process incoming messages