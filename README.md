# Farbwerk · Mein Tischplaner

Interaktiver Aufbewahrungsplaner für einen **Basteltisch mit anpassbarer Größe** (Startmaß: 180 × 90 cm): zwei Vallejo-Koffer, weitere Vallejo-Flaschen und Citadel-Töpfe.

**Direkt im Browser öffnen — ohne Installation:** https://toxodia.github.io/farbwerk-tischplaner/

Dieses Repository enthält den vollständigen Quellcode und die automatisierten Tests. Es benötigt keine externen Bibliotheken und keinen Build-Schritt. Repository und GitHub-Pages-Website sind öffentlich. Persönliche Anordnungen bleiben im lokalen Speicher des jeweiligen Browsers.

## Optional lokal starten

Voraussetzung: Node.js ab Version 20.

1. Repository herunterladen oder klonen und im Terminal in den Projektordner wechseln.
2. `npm start` ausführen. Ein `npm install` ist nicht nötig.
3. http://127.0.0.1:8080 im Browser öffnen.

Mit `Strg+C` wird der lokale Server beendet. Die HTML-Datei bitte über den Server öffnen, da die Anwendung JavaScript-Module verwendet.

## Funktionen

- Tischbreite und -tiefe von 40 bis 400 cm anpassen, inklusive maßstäblicher Draufsicht, 5-cm-Raster und Drehen.
- Bei einer Größenänderung behalten Elemente ihre realen Maße und Positionen. Überstände werden gemeldet; die reservierte Arbeitsfläche bleibt innerhalb des Tisches.
- Tischmaße werden gespeichert und mit exportiert. Ältere Pläne ohne Tischmaße werden mit 180 × 90 cm geöffnet.
- Eigene Aufbewahrungselemente sowie editierbare Breite, Tiefe, Höhe und getrennte Kapazitäten für Vallejo/Citadel.
- Bestands- und Kapazitätsvergleich ohne doppeltes Zählen des Kofferinhalts.
- Hinweise auf Überschneidungen, Überstände und belegte Arbeitsfläche.
- Automatisches Speichern im Browser und Planexport/-import als JSON.
- Tastatur: Pfeile verschieben das gewählte Element, `R` dreht, `Entf` entfernt.

Die voreingestellten Elementmaße und Kapazitäten sind **Beispielwerte**, keine bestätigten Produktdaten. Stellflächen inklusive benötigter Öffnungsfläche nachmessen. Die Dachschräge wird nicht geometrisch geprüft; Höhen selbst abgleichen.

## Eigene Pläne sichern

Beim Wechsel von der bisherigen Sites-Adresse zu GitHub Pages den Plan zuerst exportieren und auf der neuen Seite importieren. Beide Adressen verwenden getrennten Browserspeicher.

Dein Plan liegt im lokalen Speicher des jeweiligen Browsers. Er wird nicht automatisch mit GitHub, anderen Browsern oder der privaten Website synchronisiert. Über **Plan exportieren** kannst du ihn sichern und auf einem anderen Gerät mit **Plan importieren** laden. Die Quellcodesicherung enthält den Beispielplan, nicht deine nachträglichen Browseränderungen.

## Tests

```sh
npm test
```

39 automatisierte Prüfungen decken Kapazitätsberechnung, Geometrie, Positionsänderungen, Drehen, Bearbeiten, Hinzufügen/Entfernen, Persistenz und Import/Export ab. Ereignisbehandlung wird mit einem kleinen DOM-Adapter geprüft; diese Tests ersetzen keine visuelle Browserprüfung.

## Dateien

| Pfad | Inhalt |
| --- | --- |
| `index.html` | Oberfläche |
| `style.css` | Layout und Darstellung |
| `core.mjs` | Planungsmodell und Berechnungen |
| `app.mjs` | Oberfläche und Interaktionen |
| `serve.mjs` | Lokaler Server ohne zusätzliche Pakete |
| `*.test.mjs` | Automatisierte Prüfungen |

Zum Hosting werden nur `index.html`, `style.css`, `app.mjs` und `core.mjs` benötigt. Private Zugriffsrechte werden vom jeweiligen Hostingdienst durchgesetzt, nicht durch den statischen Quellcode.


