# Polityka prywatności

Data wejścia w życie: 18 lipca 2026 r.

Konwerter walut przelicza zaznaczone ceny w USD i EUR na PLN w przeglądarce Firefox.

## Dane przetwarzane lokalnie

Rozszerzenie odczytuje tekst zaznaczony przez użytkownika wyłącznie po to, aby rozpoznać obsługiwaną cenę i obliczyć jej wartość w PLN. Zaznaczony tekst, kwota, adres strony i historia przeglądania pozostają w przeglądarce. Nie są wysyłane do autora ani do usługi analitycznej.

Skrypt strony przekazuje jedynie rozpoznany kod waluty (`USD` albo `EUR`) do własnego skryptu działającego w tle. Jest to wewnętrzna komunikacja przeglądarki, która nie opuszcza urządzenia.

Rozszerzenie zapisuje ostatnią pobraną tabelę kursów NBP, datę jej obowiązywania i czas pobrania w lokalnej pamięci rozszerzenia. Pamięć podręczna jest zastępowana po udanym odświeżeniu i usuwana po wyczyszczeniu danych rozszerzenia albo jego odinstalowaniu.

Przeliczona wartość trafia do schowka systemowego wyłącznie po kliknięciu wyniku przez użytkownika.

## Komunikacja sieciowa

Aby udostępniać oficjalne kursy, skrypt działający w tle pobiera tabelę A NBP z adresu:

`https://api.nbp.pl/api/exchangerates/tables/a/?format=json`

Zapytanie nie zawiera zaznaczonego tekstu, kwoty, adresu strony, historii przeglądania, identyfikatora konta ani identyfikatora śledzącego utworzonego przez autora. Tak jak przy każdym połączeniu sieciowym, operator usługi może otrzymać standardowe dane połączenia, takie jak adres IP, zgodnie z własnymi zasadami.

## Dane, których rozszerzenie nie zbiera

Rozszerzenie nie ma kont użytkowników, analityki, reklam, telemetrii, raportowania awarii ani zdalnie wykonywanego kodu. Autor nie zbiera, nie sprzedaje, nie udostępnia ani nie przechowuje danych osobowych za pośrednictwem rozszerzenia.

## Zmiany

Istotne zmiany tej polityki będą opisane w historii zmian projektu i opublikowane wraz z nową datą wejścia w życie.

## Kontakt

Pytania i zgłoszenia dotyczące prywatności można przesyłać przez publiczny system zgłoszeń projektu:

https://github.com/kamil-rusiecki/KonwerterWalut/issues
