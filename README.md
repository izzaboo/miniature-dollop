# miniature-dollop

This is my homework02 assignment in NodeJS Master Class

https://pirple.com

I'm to make an API for a pizza shop. I thought about calling it pizzaboo...but nah.

POST to users with object below creates .data/users/<user-+-domain.tld>.json file

{
	"firstName" : "",
	"lastName" : "",
	"email" : "",
	"address" : "",
	"password":"",
	"tosAgreement":true
}

POST to /tokens with object.email and object.password in body returns 200 OK if email/pass are valid.

GET to /users?email=<user@domain.tld> with token in header returns user Object.

PUT to /users?email=<user@domain.tld> with token in header updates user Object file with Object.<data> in body of request Returns 200 OK.

DELETE to /users?email=<user@domain.tld> with token in header deletes user and orders associated with user

@TODO delete each of the existing orders associated with a deleted user

PUT to /tokens with Object.id (token) and .extend (true) in body extends expiration of token

DELETE to /tokens?id=<tokenID> removes token file from tokens.

GET to /menu?email=<user@domain.tld> with token in header returns menu Object

POST to /orders with token in header and order Object in body payload creates order file in .data/orders including orderID and email addy.

PUT (update) to /orders?orderId=<orderId> with token in header and menu item(s) in payload Object.

DELETE to /orders?orderId=<orderid> with token in header.

@TODO POST to /submit?orderid=<orderId> with token in header. User submits order when ready, Integrates with Stripe.com to accept payment.

@TODO When order is placed, email the user a receipt using Mailgun.com.
