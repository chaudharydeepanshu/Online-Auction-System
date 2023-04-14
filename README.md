# Online Auction System (OAS)

## Explanation of what the aim of the project is:-
- Showcase how to work with No-SQL databases like mogoDB and use a backend like NodeJS to securely run code on the server side instead of the client side(user browser).
- 3 types of accounts with different level of authorization.
  - Admin – Can access the admin panel to delete every listing and bidding.
  - Seller – Can add listings, modify-delete own listings, delete own listing biddings.
  - Buyer/Bidder – Can see others listing , place a bid , delete own bid.
- Implementation of facial recognition for login.

## Module Implementation:-
- Implementation of backend through NodeJS with MongoDB database. 
- Implementation new users registration( with email verification) and existing users login.
- Implementation dynamic pages with distinction for Admin, Seller and Buyer account. 
- Implementation of sessions using cookies to increase user security.
- Make website available live at https://oas.up.railway.app/
- Implementation of listing and biddings through users.
- Implementation of login through facial recognition.

## Programming Technologies used in the project:
- For the frontend development of project, we used the knowledge of:
  - EJS (Embedded JavaScript template)
  - HTML
  - CSS
  - Bootstrap
  - JavaScript
  - jQuery
  <img src= "https://user-images.githubusercontent.com/85361211/163674798-e1df24e8-ae5c-42ce-9e34-5bdd2e9dbafb.png" width="500">
- For the backend development of project, we used the knowledge of:
  - Express.js with Node.js
  - MongoDB for database
  <img src= "https://user-images.githubusercontent.com/85361211/163674870-ec5f63be-a58c-470d-9945-82b2218c182b.png" width="500">
- In this project we also use a NodeJS library for facial recognition which is written in TensorFlow (a library for machine learning and artificial intelligence). This library uses deep learning models which can do facial recognition. It will be used in the backend which is written in NodeJS. Then we use EJS (client-side JavaScript) template in our website to get user facial image during login and then communicate with the facial recognition library with the help of the NodeJS backend.
  
  <img src= "https://user-images.githubusercontent.com/85361211/163674944-cb3fc52d-1184-4030-83f2-9cbdd3d5cbca.png" width="500">


## Diagrams
| Diagram for core architecture of project |
| :----: |
|<img src= "https://user-images.githubusercontent.com/85361211/163674583-25c52c9a-ae6e-4f4e-b4b9-68da57dc5d74.png" width="800">|

| Diagram for architecture of User login and registration |
| :----: |
|<img src= "https://user-images.githubusercontent.com/85361211/163674660-71f0b940-fbe8-4695-b158-2e2f1fe30911.png" width="800">|

| Diagram of users access to MongoDB on the basis of user type |
| :----: |
|<img src= "https://user-images.githubusercontent.com/85361211/163674709-e0f11285-7196-4c99-b4ed-013bcccfac8d.png" width="800">|

## Project Screenshots
| HomePage |
| :----: |
|<img src= "https://user-images.githubusercontent.com/85361211/163674200-657b5a4c-7b5f-48fc-b809-fe952d79d84a.png" width="800">|

| Registration |
| :----: |
|<img src= "https://user-images.githubusercontent.com/85361211/163674245-1e61249a-c041-4f9b-b8f0-ec5b770f836f.png" width="800">|

| Login |
| :----: |
|<img src= "https://user-images.githubusercontent.com/85361211/163674273-0848aec7-2928-4e84-943e-8d2279b9989e.png" width="800">|

| Facial Recognition Screen |
| :----: |
|<img src= "https://user-images.githubusercontent.com/85361211/163674492-840b4859-ac42-47ec-87ec-aa4411c40261.png" width="800">|

| Account Type selection on login |
| :----: |
|<img src= "https://user-images.githubusercontent.com/85361211/163674300-04a7583b-db87-43c3-8d12-b0e7f31c1ed7.png" width="800">|

| Buyer Listing Page |
| :----: |
|<img src= "https://user-images.githubusercontent.com/85361211/163674346-2240becf-3473-46a2-ad31-2925e123ea59.png" width="800">|

| Buyer Listing Page |
| :----: |
|<img src= "https://user-images.githubusercontent.com/85361211/163674346-2240becf-3473-46a2-ad31-2925e123ea59.png" width="800">|

| Buyer Bidding Page |
| :----: |
|<img src= "https://user-images.githubusercontent.com/85361211/163674367-8c30b08c-6c41-4623-a1ba-be93a754efdc.png" width="800">|

| MongoDB database screen |
| :----: |
|<img src= "https://user-images.githubusercontent.com/85361211/163674534-a6995121-9ae2-4654-9503-8e36b958f36d.png" width="800">|

