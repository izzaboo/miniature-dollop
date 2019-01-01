# miniature-dollop

This is my homework02 assignment in NodeJS Master Class

https://pirple.com

I'm supposed to make an API for a pizza shop. I thought about calling it pizzaboo...but nah.

POST to users with object below creates .data/users/<user-+-domain.tld>.json file

{
	"firstName" : "",
	"lastName" : "",
	"email" : "",
	"address" : "",
	"password":"",
	"tosAgreement":true
}

POST to tokens with object.email and object.password in body returns Object with .id and .expires therein.

GET to users?email=<user@domain.tld> with token in header returns user Object.

PUT to users?email=<user@domain.tld> with token in header updates user Object with Object.<data> in body of request.

PUT to tokens with Object.id (token) and .extend (true) in body extends expiration of token

DELETE to tokens?id=<tokenID> removes token file from tokens.

GET to menu?email=<user@domain.tld> with token in header returns menu Object

POST to orders with tokenID in header and order Object in body payload creates order file in .data/orders including orderID and email addy.
