# Server

- Server hosts clients and files
- Server holds history of message-hashcodes
- Files are served and received by HTTP transfer (pure data)
    - HTTP/1.0 GET <file> receives a file
    - HTTP/1.0 PUT <file> stores a file
    - HTTP/1.0 DELETE <file> deletes a file

## Statistics

What kind of statistics could be shown?

- Active clients
- Active jobs