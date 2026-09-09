# Write-up

> This is the skeleton - replace everything in blockquotes with your own words
> and delete the prompts as you go. Aim for **~300 words** across the four
> questions; the route reference below can be as long as it needs to be.
>
> Write it like you're handing the work to a teammate. We'd rather read an
> honest "I ran out of time on X and here's what I'd do" than a polished list of
> accomplishments. **Submit this even if you didn't finish** - see CHALLENGE.md.

## 1. What did you build for Part B, and why that?

> What made you pick it over everything else you could have built? This is the
> question we care most about - the _why_ matters more than the _what_.
The feature that I shipped out was the ability to see your tracked restaurants on a map in the form of markers with ratings attached to them. I copied this feature from the Beli mobile app which has a similar idea to this project. I just thought that it was the most logical continuation from the idea of tracking the restaurants that you visited. And the colored markers are also helpful too since you can easiily discern which restaurants are better than others, as opposed to a list format. 

## 2. What did you decide, and what did you rule out?

> Route shapes, data model, where the logic lives, what you deliberately didn't
> do. Name a tradeoff you're not sure you got right.
-  I added GET and POST routes for visits and stored latitude and longitude on restaurants so the map can place markers without looking up the address each time.
- I used Leaflet for the map and MapTiler for map tiles and address autocomplete. I kept database queries and validation in the API routes andused separate frontend components for the map, visits list, and add-visit form.
- I left out editing and deleting visits to focus on adding and displaying them.
- One tradeoff I'm not sure I got right is allowing for restaurants to have null coordinates. I made this decision to better fit the tasks we can to do in Part A but this could make things more confusing down the road. Additionally, another tradeoff was choosing to calculate total spend using the GET visits API rather than creating a separate API endpoint altogether. 


## 3. Where did you cut corners?

> What would you fix first with another day?
I would add the ability to edit and delete visits on the Visits list as well as the ability to select a restaurant on the map and delete the restaurant as well as all visits associated with it. I would also like to make the visits panel scroll independently so users can browse a long lists of visits while keeping the map and total spending visible. Lastly, a way to filter visits would be nice as well. This would make the app feel more complete in my opinion.

---

## Part B: routes

| Method and path | What it does | Success | Errors |
| --------------- | ------------ | ------- | ------ |
| `GET /api/visits` | List visits with their restaurants, newest visit date first | `200` + JSON array (`[]` if empty) | — |
| `POST /api/visits` | Record a visit to an existing restaurant | `201` + created visit | `400` on invalid body; `404` if restaurant is missing |

**`POST /api/visits`**

```jsonc
// request
{
  "restaurantId": 1,
  "date": "2026-09-09",
  "amountSpent": 18.50,
  "notes": "Lunch"
}

// 201 response
{
  "id": 4,
  "restaurantId": 1,
  "date": "2026-09-09",
  "amountSpent": 18.50,
  "notes": "Lunch",
  "createdAt": "2026-09-09T19:00:00.000Z"
}

**`GET /api/visits`**

Each entry includes the visit fields above plus its associated `restaurant`:

```json
[
  {
    "id": 4,
    "restaurantId": 1,
    "date": "2026-09-09",
    "amountSpent": 18.50,
    "notes": "Lunch",
    "createdAt": "2026-09-09T19:00:00.000Z",
    "restaurant": {
      "id": 1,
      "name": "CAVA",
      "cuisine": "Mediterranean",
      "address": "3201 S Hoover St, Suite 1840, Los Angeles, CA 90089",
      "rating": 4.5,
      "createdAt": "2026-09-09T18:00:00.000Z",
      "latitude": 34.025019,
      "longitude": -118.284484
    }
  }
]
```
## Schema changes

> Any migrations you added (`002_*.sql`, ...), new tables or columns, and
> anything a reviewer needs to run beyond `./setup.sh`. Write "none" if there
> were none.

- Added `client/db/migrations/002_restaurant_coordinates.sql` to add nullable
`latitude` and `longitude` columns (`DOUBLE PRECISION`) to the existing
`restaurants` table for map markers.
- The MapTiler key is included in `client/.env.example`. `./setup.sh` copies it
to `client/.env.local` if that file does not already exist, so no manual key
setup is needed.

## How I verified this

> How you checked your work - the happy paths _and_ the failures. `curl`
> commands, a Postman collection, a scratch script, screenshots: whatever you
> actually used. Paste the commands.
>
> This is much faster for us to review than working it out ourselves, and it's
> how you show you checked the edge cases.

**Part A** - the contract table in CHALLENGE.md, every row including the error
cases:

```bash
# e.g.
curl -i http://localhost:3000/api/restaurants          # 200 + array
curl -i http://localhost:3000/api/restaurants/99999    # 404
curl -i http://localhost:3000/api/restaurants/abc      # 404
curl -i -X POST http://localhost:3000/api/restaurants \
  -H 'Content-Type: application/json' \
  -d '{"name":"Out Of Range","rating":6}'              # 400
```

**Part B** - the equivalent cases for what you built:

```bash
Postman collection: [Feeding Brennen](postman/Feeding-Brennen.postman_collection.json).
Import the collection and send the happy-path and unhappy-path requests manually
in the listed order. Replace example restaurant ID `6` in URLs and visit bodies
with the ID returned by Create restaurant. The final three requests use its deleted
ID. Status codes in the request names are expected results.
```

## Known issues / what I'd do next

> Anything broken, unfinished, or that you know is wrong. Being upfront here
> costs you nothing and tells us a lot.

The restaurant API allows latitude and longitude to both be null. Visits to
these restaurants appear in the visits list, but the restaurants cannot appear
on the map without coordinates.
