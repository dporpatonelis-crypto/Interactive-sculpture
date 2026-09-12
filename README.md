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
## Επιλογή γλυπτού και lipsync

Το κουμπί **🏛️ Γλυπτό** ανοίγει τον ίδιο επιλογέα που χρησιμοποιεί το Light Up Legacy. Ο κατάλογος περιλαμβάνει την αφαιρετική μορφή, τον Bishop, το Dimitris avatar και το Ready Player Me avatar. Τα GLB παραμένουν στη βιβλιοθήκη του Light Up Legacy και φορτώνονται με ασφαλή αντιστοίχιση των περιοχών `head`, `trunk` και `arms` — δεν αντιγράφονται στο repository.

Το **lipsync** λειτουργεί όταν το επιλεγμένο GLB έχει facial morph targets. Ο Web Audio analyser μετατρέπει την ένταση και το φασματικό κέντρο του WAV σε mouth/jaw/viseme κινήσεις. Πάτησε πρώτα **🔊 Ενεργοποίηση ήχου**· στο `slides-discovery` το WAV είναι απενεργοποιημένο από το σενάριο, ενώ στο `basileiada` εμφανίζεται η αντίστοιχη ηχητική επιβράβευση. Η ένδειξη στην κορυφή αναφέρει αν συνδέθηκε lipsync ή αν το GLB είναι μόνο audio-only.

## Συμπτυγμένη πληροφορία

Οι περιοχές, η συλλογική μνήμη και οι έλεγχοι είναι κρυφοί αρχικά. Άνοιξε **ℹ️ Πληροφορίες** και επίλεξε μόνο την ενότητα που χρειάζεσαι, ώστε η σκηνή να παραμένει καθαρή.
