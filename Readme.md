


////////////////////////
                 Communication Server
                         │
          ┌──────────────┴──────────────┐
          │                             │
       REST API                      Socket.IO
          │                             │
  ┌───────┼────────┐            ┌───────┼────────┐
  │       │        │            │       │        │
Direct   Group   History       Join    Send    Edit/Delete
Chat     Chat    Messages      Room   Message
  │       │        │            │       │        │
  └───────┴────────┴────────────┴───────┴────────┘
                         │
                      MongoDB

/////////////////////////
REST

create/get direct conversation
create group
get user's conversations
fetch message history

Socket.IO

join conversation
send message
edit message
delete message
later: typing indicator
later: read receipts
later: online/offline status

MongoDB

persistent state
atomic message updates
unique constraints

Host application

authentication
user identity

Conversation
 ├── type
 ├── displayName
 ├── participantKey 🔐 unique
 └── timestamps

Participant
 ├── userId
 ├── conversationId
 ├── joinedAt
 └── (conversationId + userId) 🔐 unique

Message
 ├── conversationId
 ├── senderId
 ├── content
 ├── messageType
 ├── status
 ├── isDeleted
 └── timestamps