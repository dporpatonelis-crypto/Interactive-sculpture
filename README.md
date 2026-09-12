# Interactive Sculpture

Τρισδιάστατο web/VR γλυπτό για συλλογική εργασία και ανακάλυψη μαθητικών γραπτών.

Live εφαρμογή: [Google Slides Discovery mode](https://dporpatonelis-crypto.github.io/Interactive-sculpture/?scenario=slides-discovery)

## Discovery modes

- `classroom` — κενό γλυπτό για ελεύθερη εισαγωγή συνεισφορών.
- `basileiada` — προαιρετικό, αυτόνομο demo quest για τη Βασιλειάδα.
- `slides-discovery` — κάθε μη κενό πεδίο της πρώτης διαφάνειας «δόγμα και βίωμα» γίνεται κρυφό εύρημα. Οι μαθητές το βρίσκουν στον χώρο, βλέπουν το πλήρες κείμενο και φωτίζουν την περιοχή του γλυπτού.

Το mode ενεργοποιείται με `?scenario=slides-discovery` ή `?mode=slides-discovery`.

## Πηγή δεδομένων

Το Discovery Mode φορτώνει το `data/slides-discoveries.json`, το οποίο γράφεται από το bound Apps Script του Google Slide. Το snapshot περιλαμβάνει `discoveries[]` με `region`, `team`/`student`/`group`, `category`, `shortText`, `fullText`, `source` και σταθερό `markerPosition`.

Η ίδια εκτέλεση του Apps Script μπορεί να ενημερώσει και το `light-up-legacy/public/contributions.json`. Από το Slides μενού χρησιμοποίησε **🌐 Ενημέρωση και των δύο**.

## Περιοχές

`base`, `trunk`, `arms`, `head`, `periphery`, `core` αντιστοιχούν στις έξι περιοχές του γλυπτού. Τα πέντε γνωστά πεδία του πρώτου Slide αντιστοιχούν σε `head`, `arms`, `trunk`, `base`, `core`· επιπλέον textbox μπορεί να χρησιμοποιήσει το prefix `[light-up:periphery]`.
