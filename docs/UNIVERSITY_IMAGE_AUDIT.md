# University Campus Image Audit

Generated: 2026-07-12

This audit covers the 92 unique universities currently displayed in Atlas Exchange. The UI now checks exact Wikipedia institution pages and rejects logos, seals, unrelated institutions, and non-campus Commons results.

## Current Result

- Confirmed without a usable candidate in the completed lookup: CentraleSupelec, Paris, France.
- Unverified because Wikimedia returned HTTP 429: 58 universities.
- Withheld: 33 provisional first-pass matches. They are not called verified because the earlier broad matcher produced wrong-school results.

The known false positives were Oxford Brookes for the University of Oxford, Ritsumeikan for Kyoto University and the University of Osaka, and a fossil specimen for the University of Zurich. Regression tests now reject those cases.

## Unverified Source Queue

- United Kingdom: University of Edinburgh; University of Cambridge.
- South Korea: Korea University; KAIST; POSTECH; Ewha Womans University; Hanyang University.
- Japan: University of Tokyo; Waseda University.
- China: Peking University; Tsinghua University; Fudan University; Shanghai Jiao Tong University; Zhejiang University; Nanjing University.
- Hong Kong: University of Hong Kong.
- Taiwan: National Taiwan University; National Cheng Kung University; National Tsing Hua University; National Yang Ming Chiao Tung University; National Chengchi University.
- Australia: University of Sydney; University of Melbourne; University of New South Wales; University of Queensland.
- New Zealand: University of Auckland; University of Canterbury; University of Otago; Victoria University of Wellington.
- Switzerland: ETH Zurich.
- Netherlands: Delft University of Technology; Eindhoven University of Technology; University of Amsterdam; Utrecht University; Erasmus University Rotterdam; Leiden University.
- France: Sciences Po; Mines Paris; INSA Lyon; HEC Paris; ESSEC Business School.
- Germany: Technical University of Munich; RWTH Aachen University; Free University of Berlin.
- USA East Coast: Princeton University; University of Pennsylvania; Cornell University; Boston University; Georgetown University; New York University.
- USA West Coast: University of California System-Wide.
- Canada: University of British Columbia; McGill University; University of Waterloo; Queen's University, Kingston; Western University.
- Mexico: Tecnologico de Monterrey; ITAM.

## Source Links

- [CentraleSupelec campus search on Pinterest](https://www.pinterest.com/search/pins/?q=CentraleSupelec%20campus)
- [CentraleSupelec campus search on Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=CentraleSupelec%20campus%20building&title=Special:MediaSearch&type=image)

Run `node scripts/audit-university-images.mjs` after the Wikimedia rate limit clears. The script generates a machine-readable JSON report and refreshes this Markdown report using the stricter matcher.
