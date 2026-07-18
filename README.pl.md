# Konwerter zaznaczonych walut dla Firefoksa

Lokalne rozszerzenie do Firefoksa, które przelicza zaznaczone ceny w USD albo EUR na PLN. Kursy pochodzą z najnowszej dostępnej tabeli A Narodowego Banku Polskiego.

Pełna dokumentacja techniczna i instrukcje budowania znajdują się w angielskim pliku [README.md](README.md).

## Jak działa rozszerzenie

1. Zaznacz pełną cenę wraz z symbolem albo kodem waluty, na przykład `$19.99`, `19,99 USD`, `EUR 1.234,56` lub `25 €`.
2. Nad zaznaczeniem pojawi się wynik w PLN.
3. Kliknij wynik, aby skopiować go do schowka.

Sama kwota bez oznaczenia waluty, zakres cen oraz zaznaczenie zawierające kilka kwot są ignorowane.

## Prywatność

Zaznaczony tekst, kwota i adres odwiedzanej strony nie opuszczają przeglądarki. Rozszerzenie pobiera pełną tabelę kursów A z API NBP i zapisuje ją w lokalnej pamięci Firefoksa.

Rozszerzenie nie zawiera analityki, reklam, kont użytkowników ani zdalnie wykonywanego kodu. Szczegóły opisuje [polityka prywatności](PRIVACY.pl.md).

## Ograniczenia wersji 0.1.0

- walutą docelową jest wyłącznie PLN;
- obsługiwane są USD i EUR;
- rozszerzenie nie działa na chronionych stronach Firefoksa, takich jak `about:*`, wbudowany czytnik PDF oraz Mozilla Add-ons;
- używany jest średni kurs NBP, a nie kurs transakcyjny banku lub karty.

## Licencja

Projekt jest udostępniany na licencji [MIT](LICENSE).
