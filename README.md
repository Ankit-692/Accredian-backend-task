# Backend

The backend is made with NodeJs,ExpressJs and Prisma for ORM between API and SQL database.

## Database

The database is a PostgresSql db hosted on Render.com. The Form data from the frontend is stored in the database in Two different tables which are 'user' and 'referrals' both tables are in relation with user who sent referrals and the users who recieves referrals.

## Email Notifications

Referral code is sent to the referred email using google mail service Api.
