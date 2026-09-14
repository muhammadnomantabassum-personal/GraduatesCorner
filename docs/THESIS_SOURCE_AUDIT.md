# Thesis source audit — 2026-09-13

Follow-up: Klarna now uses its public Deel board at https://jobs.deel.com/klarna. Live tests read 20 structured vacancy pages and advanced to the next page successfully. FINN was removed from the active catalogue because its crawler notice requires written permission for recurring automated collection. Historical imported records are preserved.

Checked all 236 supplied URL entries using public HTTP requests, followed published vacancy-board links, and tested configured feeds with the actual importer without writing to the database. A successful homepage response alone does not count as a usable feed.

Added 17 sources and updated 2 existing endpoints. Empty supported ATS searches are retained so future vacancies can be discovered. Broken, parked, blocked, unparseable, and informational-only sources were not added. Existing unrelated sources and admin preferences are preserved.

## Configured feeds

| Source | Country | Feed | Thesis results | Internship results |
|---|---|---|---:|---:|
| Alstom Sweden | Sweden | [successfactors](https://jobsearch.alstom.com/search/) | 3 | 0 |
| Combitech | Sweden | [workday](https://saabgroup.wd116.myworkdayjobs.com/Combitech_careers) | 0 | 0 |
| Aalto University | Finland | [workday](https://aalto.wd3.myworkdayjobs.com/aalto) | 3 | 0 |
| Outokumpu | Finland | [successfactors](https://careers.outokumpu.com/search/) | 0 | 0 |
| Huhtamaki | Finland | [workday](https://huhtamaki.wd103.myworkdayjobs.com/External) | 0 | 3 |
| Vaisala | Finland | [successfactors](https://careers.vaisala.com/search/) | 0 | 0 |
| Wilhelmsen | Norway | [workday](https://wilhelmsen.wd3.myworkdayjobs.com/Wilhelmsen) | 0 | 1 |
| Carlsberg Group | Denmark | [successfactors](https://careers.carlsberg.com/search/) | 0 | 0 |
| ISS World | Denmark | [successfactors](https://jobs.issworld.com/search/) | 0 | 0 |
| Rockwool | Denmark | [workday](https://rockwoolgroup.wd3.myworkdayjobs.com/ROCKWOOL) | 0 | 0 |
| FLSmidth | Denmark | [workday](https://flsmidth.wd3.myworkdayjobs.com/FLS_Global) | 0 | 0 |
| GN Group | Denmark | [workday](https://gn.wd3.myworkdayjobs.com/GN-Careers) | 0 | 0 |
| Fugro | Netherlands | [workday](https://fugro.wd3.myworkdayjobs.com/Careers) | 0 | 0 |
| Damen Shipyards | Netherlands | [workday](https://damen.wd3.myworkdayjobs.com/Damen_Careers) | 0 | 2 |
| Volkswagen Group | Germany | [successfactors](https://jobs.volkswagen-group.com/search/) | 3 | 0 |
| Signify | Netherlands | [workday](https://lighting.wd3.myworkdayjobs.com/jobs-and-careers) | 0 | 6 |
| Studentjob.nl / StudentenWerk | Netherlands | [html](https://www.studentjob.nl/) | 0 | 2 |
| Deloitte Netherlands | Netherlands | [html](https://werkenbijdeloitte.nl/studenten/) | 0 | 1 |
| Nedap | Netherlands | [html](https://www.nedap.com/en/careers) | 0 | 1 |

Counts are samples from the first thesis search and, for empty ATS thesis searches, the first internship search. They are not total inventory. Repeated scans continue pagination and language-specific queries.

## Every supplied URL

| Source | Supplied URL | HTTP | Decision |
|---|---|---:|---|
| Exjobbsportalen (dedicated Swedish thesis portal) | https://exjobb.nu | 200 | Skipped: parked, error, or challenge page |
| Exjobbsportalen (dedicated Swedish thesis portal) | https://www.exjobbsportalen.se | 200 | Skipped: parked, error, or challenge page |
| Traineeguiden (grad/thesis programs) | https://www.traineeguiden.se | 200 | Skipped: no usable public vacancy feed verified |
| Sustainalink (matches students↔companies) | https://www.sustainalink.com | — | Skipped supplied link: fetch failed |
| Academic Work (student jobs/thesis) | https://www.academicwork.se | 200 | Skipped: no usable public vacancy feed verified |
| Volvo Group | https://www.volvogroup.com/en/careers/opportunities-for-students/thesis-work.html | 200 | Skipped: no usable public vacancy feed verified; existing configured Volvo Group feed retained |
| Volvo Cars | https://www.volvocars.com/intl/v/careers/students | 403 | Skipped supplied link: HTTP 403 |
| Scania | https://www.scania.com/group/en/home/careers/students.html | 404 | Skipped supplied link: HTTP 404; existing configured Scania feed retained |
| Ericsson | https://www.ericsson.com/en/careers/students | 403 | Skipped supplied link: HTTP 403; existing configured Ericsson feed retained |
| SAAB | https://saabgroup.com/career/students-graduates/ | 200 | Skipped: no usable public vacancy feed verified; existing configured Saab feed retained |
| Sandvik | https://www.home.sandvik/en/careers/students/ | 404 | Skipped supplied link: HTTP 404; existing configured Sandvik feed retained |
| ABB Sweden | https://global.abb/group/en/careers/students | 404 | Skipped supplied link: HTTP 404 |
| Atlas Copco | https://www.atlascopcogroup.com/en/careers/students | 200 | Skipped: no usable public vacancy feed verified; existing catalogue entry left unchanged |
| SKF | https://www.skf.com/group/careers/students | 200 | Skipped: no usable public vacancy feed verified; existing catalogue entry left unchanged |
| Alfa Laval | https://www.alfalaval.com/about-us/career/students/ | 404 | Skipped supplied link: HTTP 404; existing catalogue entry left unchanged |
| Husqvarna Group | https://www.husqvarnagroup.com/en/career/students | 404 | Skipped supplied link: HTTP 404 |
| Epiroc | https://www.epirocgroup.com/en/careers/students | 403 | Skipped supplied link: HTTP 403; existing catalogue entry left unchanged |
| Hexagon AB | https://hexagon.com/company/careers | 403 | Skipped supplied link: HTTP 403; existing catalogue entry left unchanged |
| Getinge | https://www.getinge.com/int/about-us/careers/ | 404 | Skipped supplied link: HTTP 404 |
| Tetra Pak | https://www.tetrapak.com/about-tetra-pak/careers/students | 404 | Skipped supplied link: HTTP 404; existing configured Tetra Pak feed retained |
| IKEA (Inter IKEA) | https://www.ikea.com/global/en/work-with-us/ | 404 | Skipped supplied link: HTTP 404 |
| H&M Group | https://hmgroup.com/careers/ | 200 | Skipped: no usable public vacancy feed verified; existing catalogue entry left unchanged |
| Spotify | https://www.lifeatspotify.com/students | 200 | Skipped: no usable public vacancy feed verified; existing configured Spotify feed retained |
| Klarna | https://www.klarna.com/careers/ | 200 | Skipped: no usable public vacancy feed verified; existing catalogue entry left unchanged |
| King (games) | https://king.com/careers | 404 | Skipped supplied link: HTTP 404; existing catalogue entry left unchanged |
| EA DICE | https://www.dice.se/students | 200 | Skipped: no usable public vacancy feed verified |
| Vattenfall | https://careers.vattenfall.com/en/students/ | 404 | Skipped supplied link: HTTP 404 |
| E.ON Sweden | https://www.eon.se/om-eon/jobba-hos-oss | 403 | Skipped supplied link: HTTP 403 |
| Preem | https://www.preem.se/om-preem/jobb-och-karriar/ | 404 | Skipped supplied link: HTTP 404 |
| Boliden | https://www.boliden.com/careers | 404 | Skipped supplied link: HTTP 404; existing catalogue entry left unchanged |
| LKAB | https://www.lkab.com/en/career/ | 200 | Skipped: no usable public vacancy feed verified |
| SSAB | https://www.ssab.com/en/company/careers | 200 | Skipped: no usable public vacancy feed verified |
| Northvolt | https://northvolt.com/careers/ | 200 | Skipped: parked, error, or challenge page |
| Sinch | https://www.sinch.com/careers/ | 200 | Skipped: no usable public vacancy feed verified |
| Autoliv | https://www.autoliv.com/careers | 200 | Skipped: no usable public vacancy feed verified |
| Alstom Sweden | https://www.alstom.com/careers | 200 | Configured verified feed |
| Combitech (Saab subsidiary) | https://www.combitech.com/en/career/students-and-graduates/ | 200 | Configured verified feed |
| ÅF / AFRY | https://afry.com/en/career/students | 404 | Skipped supplied link: HTTP 404 |
| Sweco | https://www.sweco.se/karriar/studenter/ | 404 | Skipped supplied link: HTTP 404; existing catalogue entry left unchanged |
| WSP Sweden | https://www.wsp.com/en-se/careers/students | 403 | Skipped supplied link: HTTP 403 |
| Ramboll Sweden | https://www.ramboll.com/careers/students | 200 | Skipped: no usable public vacancy feed verified |
| Nordea | https://www.nordea.com/en/careers/students-and-graduates | 200 | Skipped: no usable public vacancy feed verified; existing catalogue entry left unchanged |
| SEB | https://www.sebgroup.com/careers/students | 404 | Skipped supplied link: HTTP 404; existing catalogue entry left unchanged |
| Swedbank | https://www.swedbank.com/about-us/careers.html | 404 | Skipped supplied link: HTTP 404; existing catalogue entry left unchanged |
| Handelsbanken | https://www.handelsbanken.com/en/careers | 200 | Skipped: no usable public vacancy feed verified; existing catalogue entry left unchanged |
| AstraZeneca (Sweden R&D) | https://careers.astrazeneca.com/students | 404 | Skipped supplied link: HTTP 404 |
| SICS/RISE (Research Institutes of Sweden) | https://www.ri.se/en/work-with-us | 403 | Skipped supplied link: HTTP 403 |
| AI Sweden | https://www.ai.se/en/adoption/talent-programs/master-thesis-program | 200 | Skipped: no usable public vacancy feed verified |
| OHB Sweden | https://careers.ohb-sweden.se | 200 | Skipped: no usable public vacancy feed verified |
| IVL Swedish Environmental Institute | https://career.ivl.se | 200 | Skipped: no usable public vacancy feed verified |
| FOI (Swedish Defence Research Agency) | https://www.foi.se/en/foi/jobs.html | 404 | Skipped supplied link: HTTP 404 |
| Zenseact | https://zenseact.com/career/ | 404 | Skipped supplied link: HTTP 404 |
| Polestar | https://www.polestar.com/us/careers/ | 404 | Skipped supplied link: HTTP 404 |
| Einride | https://www.einride.tech/careers | 404 | Skipped supplied link: HTTP 404 |
| Oatly | https://www.oatly.com/careers | 404 | Skipped supplied link: HTTP 404 |
| Aalto University corporate collaboration / thesis portal | https://www.aalto.fi/en/corporate-collaboration/commission-a-masters-thesis | 200 | Configured verified feed |
| TE-palvelut / Jobly / Duunitori (general, filter "diplomityö"/"pro gradu") | https://duunitori.fi | 200 | Skipped: no usable public vacancy feed verified |
| Academic Work Finland | https://www.academicwork.fi | 200 | Skipped: no usable public vacancy feed verified |
| Nokia | https://www.nokia.com/careers/students-and-graduates/ | 403 | Skipped supplied link: HTTP 403; existing catalogue entry left unchanged |
| KONE | https://www.kone.com/en/careers/students-graduates/ | 404 | Skipped supplied link: HTTP 404; existing configured Kone feed retained |
| Wärtsilä | https://www.wartsila.com/careers/students | 404 | Skipped supplied link: HTTP 404; existing configured Wärtsilä feed retained |
| Neste | https://www.neste.com/careers/students-and-graduates | 200 | Skipped: no usable public vacancy feed verified; existing configured Neste feed retained |
| Fortum | https://www.fortum.com/careers/students | 200 | Skipped: no usable public vacancy feed verified; existing configured Fortum feed retained |
| UPM | https://www.upm.com/careers/students/ | 404 | Skipped supplied link: HTTP 404; existing catalogue entry left unchanged |
| Stora Enso | https://www.storaenso.com/en/careers/students | 403 | Skipped supplied link: HTTP 403; existing catalogue entry left unchanged |
| Metso | https://www.metso.com/careers/students/ | 404 | Skipped supplied link: HTTP 404; existing catalogue entry left unchanged |
| Valmet | https://www.valmet.com/careers/students-and-graduates/ | 404 | Skipped supplied link: HTTP 404; existing configured Valmet feed retained |
| Kesko | https://www.kesko.fi/en/careers/ | 200 | Skipped: no usable public vacancy feed verified |
| Nokian Tyres | https://www.nokiantyres.com/company/careers/ | 200 | Skipped: no usable public vacancy feed verified |
| Fazer | https://www.fazergroup.com/careers/ | 200 | Skipped: no usable public vacancy feed verified |
| Elisa | https://elisa.fi/rekry/en/ | 200 | Skipped: no usable public vacancy feed verified; existing catalogue entry left unchanged |
| Nordea (FI) | https://www.nordea.com/en/careers | 200 | Skipped: no usable public vacancy feed verified; existing catalogue entry left unchanged |
| OP Financial Group | https://www.op.fi/op-financial-group/careers | 404 | Skipped supplied link: HTTP 404; existing catalogue entry left unchanged |
| Rovio Entertainment | https://www.rovio.com/careers/ | 200 | Skipped: no usable public vacancy feed verified |
| Supercell | https://supercell.com/en/careers/ | 200 | Skipped: no usable public vacancy feed verified |
| VTT Technical Research Centre | https://www.vttresearch.com/en/careers | 200 | Skipped: no usable public vacancy feed verified |
| Business Finland | https://www.businessfinland.fi/en/for-finnish-customers/services/careers | 404 | Skipped supplied link: HTTP 404 |
| Konecranes | https://www.konecranes.com/careers | 200 | Skipped: no usable public vacancy feed verified; existing catalogue entry left unchanged |
| Cargotec (Kalmar/Hiab/MacGregor) | https://www.cargotec.com/en/careers/ | — | Skipped supplied link: fetch failed |
| Outokumpu | https://www.outokumpu.com/en/careers | 200 | Configured verified feed |
| Orion Pharma | https://www.orion.fi/en/careers/ | 200 | Skipped: no usable public vacancy feed verified |
| F-Secure / WithSecure | https://www.withsecure.com/en/about-us/careers | 200 | Skipped: no usable public vacancy feed verified |
| Huhtamaki | https://www.huhtamaki.com/en/careers/ | 200 | Configured verified feed |
| Ahlstrom | https://www.ahlstrom.com/careers/ | 200 | Skipped: no usable public vacancy feed verified |
| CGI Finland | https://www.cgi.com/finland/en/careers | 404 | Skipped supplied link: HTTP 404 |
| Reaktor | https://www.reaktor.com/careers/ | 200 | Skipped: no usable public vacancy feed verified |
| Solita | https://www.solita.fi/en/careers/ | 200 | Skipped: no usable public vacancy feed verified |
| Vaisala | https://www.vaisala.com/en/careers | 200 | Configured verified feed |
| Efecte | https://www.efecte.com/careers | 404 | Skipped supplied link: HTTP 404 |
| Karrierestart.no (thesis/trainee focus) | https://www.karrierestart.no | 403 | Skipped supplied link: HTTP 403 |
| FINN.no jobb (filter "masteroppgave") | https://www.finn.no/job | 200 | Skipped: no usable public vacancy feed verified; existing catalogue entry left unchanged |
| NAV / Academic Work Norway | https://www.academicwork.no | 200 | Skipped: no usable public vacancy feed verified |
| Equinor | https://www.equinor.com/careers/students | 200 | Skipped: no usable public vacancy feed verified; existing configured Equinor feed retained |
| Statkraft | https://www.statkraft.com/careers/students-and-graduates/ | 200 | Skipped: no usable public vacancy feed verified; existing catalogue entry left unchanged |
| Telenor | https://www.telenor.com/careers/ | 404 | Skipped supplied link: HTTP 404; existing catalogue entry left unchanged |
| DNV | https://www.dnv.com/careers/students/master-thesis/ | 200 | Skipped: no usable public vacancy feed verified; existing catalogue entry left unchanged |
| Aker Solutions | https://www.akersolutions.com/careers/students/ | 404 | Skipped supplied link: HTTP 404; existing catalogue entry left unchanged |
| Aker BP | https://www.akerbp.com/en/careers/ | 404 | Skipped supplied link: HTTP 404; existing catalogue entry left unchanged |
| Yara International | https://www.yara.com/careers/ | 200 | Skipped: no usable public vacancy feed verified; existing configured Yara International feed retained |
| Norsk Hydro | https://www.hydro.com/en/careers/students/ | 404 | Skipped supplied link: HTTP 404; existing configured Norsk Hydro feed retained |
| Kongsberg Gruppen | https://www.kongsberg.com/careers/students/ | 200 | Skipped: no usable public vacancy feed verified; existing configured Kongsberg Gruppen feed retained |
| Norwegian Air Shuttle | https://www.norwegian.com/about/career/ | 403 | Skipped supplied link: HTTP 403; existing catalogue entry left unchanged |
| Statnett | https://www.statnett.no/en/about-statnett/career/ | 404 | Skipped supplied link: HTTP 404 |
| Vår Energi | https://www.varenergi.no/en/careers/ | 200 | Skipped: no usable public vacancy feed verified |
| TietoEVRY | https://www.tietoevry.com/en/careers/ | 200 | Skipped: no usable public vacancy feed verified |
| Schlumberger Norway | https://careers.slb.com | 200 | Skipped: no usable public vacancy feed verified |
| Subsea 7 | https://subsea7.com/en/careers.html | 200 | Skipped: parked, error, or challenge page |
| Cognite | https://www.cognite.com/en/careers | 404 | Skipped supplied link: HTTP 404 |
| DNB (bank) | https://www.dnb.no/en/about-us/careers.html | 200 | Skipped: no usable public vacancy feed verified; existing catalogue entry left unchanged |
| Storebrand | https://www.storebrand.no/karriere | 200 | Skipped: no usable public vacancy feed verified; existing configured Storebrand feed retained |
| Sparebank 1 | https://www.sparebank1.no/en/about-us/career.html | 404 | Skipped supplied link: HTTP 404 |
| Elkem | https://www.elkem.com/careers/ | 404 | Skipped supplied link: HTTP 404 |
| Nel Hydrogen | https://nelhydrogen.com/careers/ | 200 | Skipped: no usable public vacancy feed verified |
| Wilhelmsen | https://www.wilhelmsen.com/careers/ | 200 | Configured verified feed |
| Skanska Norway | https://www.skanska.no/karriere/ | 200 | Skipped: no usable public vacancy feed verified |
| Multiconsult | https://www.multiconsult.no/karriere/ | 404 | Skipped supplied link: HTTP 404 |
| Norconsult | https://www.norconsult.com/careers/ | 404 | Skipped supplied link: HTTP 404 |
| Sopra Steria Norway | https://www.soprasteria.no/karriere | 200 | Skipped: no usable public vacancy feed verified |
| Studentjob.dk | https://studentjob.dk | — | Skipped supplied link: fetch failed |
| Graduateland | https://graduateland.com | 200 | Skipped: no usable public vacancy feed verified |
| Universities (DTU, CBS, AU, KU) run "Thesis in company" / "Erhvervskandidat" databases — DTU's is especially large | https://www.dtu.dk/english/career/students/thesis-projects | 404 | Skipped supplied link: HTTP 404 |
| Novo Nordisk | https://www.novonordisk.com/careers/students.html | 404 | Skipped supplied link: HTTP 404 |
| Novozymes (now part of Novonesis) | https://www.novonesis.com/en/careers | 200 | Skipped: no usable public vacancy feed verified |
| Maersk | https://www.maersk.com/careers/students | 404 | Skipped supplied link: HTTP 404 |
| Vestas | https://www.vestas.com/en/careers/students | 404 | Skipped supplied link: HTTP 404 |
| Ørsted | https://orsted.com/en/careers/students | 403 | Skipped supplied link: HTTP 403 |
| Grundfos | https://www.grundfos.com/careers/students | 404 | Skipped supplied link: HTTP 404 |
| Danfoss | https://www.danfoss.com/en/about-danfoss/careers/students-and-graduates/ | 404 | Skipped supplied link: HTTP 404 |
| Lego | https://www.lego.com/en-us/careers/students | 404 | Skipped supplied link: HTTP 404 |
| Coloplast | https://www.coloplast.com/careers/students/ | 403 | Skipped supplied link: HTTP 403 |
| Carlsberg Group | https://www.carlsberggroup.com/careers/ | 200 | Configured verified feed |
| Pandora | https://pandoragroup.com/careers | 200 | Skipped: no usable public vacancy feed verified |
| DSV | https://www.dsv.com/en/about-dsv/careers | 404 | Skipped supplied link: HTTP 404 |
| ISS World | https://www.issworld.com/careers | 200 | Configured verified feed |
| Leo Pharma | https://www.leo-pharma.com/careers | 404 | Skipped supplied link: HTTP 404 |
| Lundbeck | https://www.lundbeck.com/global/careers | 200 | Skipped: no usable public vacancy feed verified |
| FLSmidth | https://www.flsmidth.com/en-gb/careers | 200 | Configured verified feed |
| Rockwool | https://www.rockwoolgroup.com/careers/ | 200 | Configured verified feed |
| Arla Foods | https://www.arla.com/company/careers/ | 404 | Skipped supplied link: HTTP 404 |
| Topdanmark | https://www.topdanmark.com/careers | 200 | Skipped: no usable public vacancy feed verified |
| Danske Bank | https://danskebank.com/careers/students | 200 | Skipped: no usable public vacancy feed verified |
| Siemens Gamesa/Siemens Energy DK | https://www.siemens-energy.com/global/en/home/careers.html | 200 | Skipped: no usable public vacancy feed verified; existing catalogue entry left unchanged |
| NNIT | https://www.nnit.com/careers/ | 200 | Skipped: no usable public vacancy feed verified |
| Ramboll | https://www.ramboll.com/careers/students | 200 | Skipped: no usable public vacancy feed verified |
| COWI | https://www.cowi.com/careers/students | 404 | Skipped supplied link: HTTP 404 |
| Terma | https://www.terma.com/careers/ | 403 | Skipped supplied link: HTTP 403 |
| GN Group (GN Hearing/Resound) | https://www.gn.com/careers | 200 | Configured verified feed |
| William Demant/Demant | https://www.demant.com/en-gb/careers | 404 | Skipped supplied link: HTTP 404 |
| Studentjob.nl / StudentenWerk | https://www.studentjob.nl | 200 | Configured verified feed |
| Universities (TU Delft, TU Eindhoven, University of Twente) maintain thesis/vacancy boards, e.g. TU Delft | https://www.tudelft.nl/en/eemcs/current/graduation | 404 | Skipped supplied link: HTTP 404 |
| Academic Transfer (research/thesis) | https://www.academictransfer.com | 200 | Skipped: no usable public vacancy feed verified |
| ASML | https://www.asml.com/en/careers/students | 404 | Skipped supplied link: HTTP 404; existing catalogue entry left unchanged |
| Philips | https://www.philips.com/a-w/about/careers/students.html | 404 | Skipped supplied link: HTTP 404; existing configured Philips feed retained |
| Royal Dutch Shell | https://www.shell.com/careers/students.html | 200 | Skipped: no usable public vacancy feed verified; existing catalogue entry left unchanged |
| KLM | https://werkenbij.klm.com/en/students | — | Skipped supplied link: fetch failed; existing catalogue entry left unchanged |
| ING Group | https://www.ing.jobs/nl-en/students/ | 200 | Skipped: no usable public vacancy feed verified; existing catalogue entry left unchanged |
| Rabobank | https://www.rabobank.jobs/en/students/ | 403 | Skipped supplied link: HTTP 403; existing catalogue entry left unchanged |
| ABN AMRO | https://www.abnamro.com/en/careers/students | 503 | Skipped supplied link: HTTP 503; existing catalogue entry left unchanged |
| Heineken | https://www.theheinekencompany.com/careers/students | 200 | Skipped: parked, error, or challenge page; existing configured Heineken feed retained |
| Unilever (NL) | https://www.unilever.com/careers/students/ | 403 | Skipped supplied link: HTTP 403; existing catalogue entry left unchanged |
| AkzoNobel | https://www.akzonobel.com/en/careers/students | 404 | Skipped supplied link: HTTP 404; existing catalogue entry left unchanged |
| DSM-Firmenich | https://www.dsm-firmenich.com/en/careers/students.html | 404 | Skipped supplied link: HTTP 404; existing configured DSM-Firmenich feed retained |
| NXP Semiconductors | https://www.nxp.com/company/about-nxp/careers/students:CAREERS-STUDENTS | 404 | Skipped supplied link: HTTP 404; existing configured NXP Semiconductors feed retained |
| TomTom | https://www.tomtom.com/careers/ | 200 | Skipped: no usable public vacancy feed verified |
| Booking.com | https://careers.booking.com/students | 404 | Skipped supplied link: HTTP 404; existing catalogue entry left unchanged |
| Adyen | https://www.adyen.com/careers | 200 | Skipped: no usable public vacancy feed verified |
| VodafoneZiggo | https://www.vodafoneziggo.nl/en/werken-bij/ | 200 | Skipped: no usable public vacancy feed verified |
| KPN | https://www.werkenbijkpn.com | 200 | Skipped: no usable public vacancy feed verified |
| Damen Shipyards | https://www.damen.com/careers | 200 | Configured verified feed |
| Vopak | https://www.vopak.com/careers | 404 | Skipped supplied link: HTTP 404 |
| Fugro | https://www.fugro.com/careers | 200 | Configured verified feed |
| Wageningen-linked companies (FrieslandCampina) | https://www.frieslandcampina.com/en/careers/ | 404 | Skipped supplied link: HTTP 404 |
| NS (Dutch Railways) | https://www.werkenbijns.nl | 200 | Skipped: no usable public vacancy feed verified |
| TenneT | https://www.tennet.eu/careers | 403 | Skipped supplied link: HTTP 403 |
| Alliander | https://www.alliander.com/en/career/ | 404 | Skipped supplied link: HTTP 404 |
| Vanderlande | https://www.vanderlande.com/careers | 404 | Skipped supplied link: HTTP 404 |
| Nedap | https://www.nedap.com/careers/ | 200 | Configured verified feed |
| BESI (Besi Semiconductor) | https://www.besi.com/careers | 200 | Skipped: no usable public vacancy feed verified |
| Signify (ex-Philips Lighting) | https://www.signify.com/global/careers | 200 | Configured verified feed |
| Thales Netherlands | https://www.thalesgroup.com/en/careers | 200 | Skipped: no usable public vacancy feed verified |
| Deloitte NL / KPMG NL / PwC NL / EY NL | https://www.werkenbijdeloitte.nl/studenten | 200 | Configured verified feed |
| ORTEC | https://www.ortec.com/en/careers | 200 | Skipped: no usable public vacancy feed verified |
| ProRail | https://www.werkenbijprorail.nl | 200 | Skipped: no usable public vacancy feed verified |
| Rijkswaterstaat | https://www.werkenbijrijkswaterstaat.nl | 200 | Skipped: no usable public vacancy feed verified |
| Absolventa (thesis/internship-focused) | https://www.absolventa.de | 200 | Skipped: no usable public vacancy feed verified |
| Studitemps / e-fellows.net | https://www.e-fellows.net | 200 | Skipped: no usable public vacancy feed verified |
| Volkswagen Group | https://www.volkswagen-karriere.de/en/students.html | 200 | Configured verified feed |
| BMW Group | https://www.bmwgroup.jobs/en/students.html | 404 | Skipped supplied link: HTTP 404; existing catalogue entry left unchanged |
| Mercedes-Benz Group | https://career.mercedes-benz.com/students | — | Skipped supplied link: fetch failed |
| Siemens | https://jobs.siemens.com/students | 404 | Skipped supplied link: HTTP 404; existing configured Siemens feed retained |
| Siemens Energy | https://jobs.siemens-energy.com/students | 404 | Skipped supplied link: HTTP 404; existing catalogue entry left unchanged |
| Bosch | https://www.bosch.com/careers/students/ | 404 | Skipped supplied link: HTTP 404; existing configured Bosch feed retained |
| SAP | https://jobs.sap.com/students | 200 | Skipped: no usable public vacancy feed verified; existing configured SAP feed retained |
| Deutsche Telekom | https://www.telekom.com/en/careers/students | 404 | Skipped supplied link: HTTP 404; existing catalogue entry left unchanged |
| BASF | https://www.basf.com/global/en/careers/students-and-graduates.html | 404 | Skipped supplied link: HTTP 404; existing catalogue entry left unchanged |
| Bayer | https://career.bayer.com/en/students | 403 | Skipped supplied link: HTTP 403; existing catalogue entry left unchanged |
| Continental | https://www.continental.com/en/career/students/ | 404 | Skipped supplied link: HTTP 404; existing catalogue entry left unchanged |
| ZF Friedrichshafen | https://careers.zf.com/students | — | Skipped supplied link: fetch failed; existing catalogue entry left unchanged |
| Deutsche Bank | https://careers.db.com/students | 404 | Skipped supplied link: HTTP 404; existing catalogue entry left unchanged |
| Allianz | https://careers.allianz.com/students | 200 | Skipped: no usable public vacancy feed verified; existing catalogue entry left unchanged |
| Infineon Technologies | https://www.infineon.com/careers/students | 200 | Skipped: no usable public vacancy feed verified; existing configured Infineon feed retained |
| Airbus (Germany) | https://www.airbus.com/en/careers/students-graduates | 404 | Skipped supplied link: HTTP 404 |
| Deutsche Bahn | https://www.deutschebahn.com/en/career/students | 404 | Skipped supplied link: HTTP 404 |
| Lufthansa Group | https://www.be-lufthansa.com/en/students | — | Skipped supplied link: fetch failed |
| Porsche | https://www.porsche.com/germany/aboutporsche/jobsatporsche/students/ | 404 | Skipped supplied link: HTTP 404 |
| Audi | https://www.audi.com/en/careers/students.html | 200 | Skipped: no usable public vacancy feed verified |
| Daimler Truck | https://careers.daimlertruck.com/students | — | Skipped supplied link: fetch failed |
| Rheinmetall | https://karriere.rheinmetall.com | — | Skipped supplied link: fetch failed |
| Thyssenkrupp | https://www.thyssenkrupp.com/en/careers/students | 200 | Skipped: no usable public vacancy feed verified; existing catalogue entry left unchanged |
| Fraunhofer-Gesellschaft (research institutes, huge thesis volume) | https://www.fraunhofer.de/en/jobs-and-career/students.html | 404 | Skipped supplied link: HTTP 404 |
| Max Planck Institutes | https://www.mpg.de/career | 200 | Skipped: no usable public vacancy feed verified; existing catalogue entry left unchanged |
| DLR (German Aerospace Center) | https://www.dlr.de/en/careers/students | 404 | Skipped supplied link: HTTP 404; existing configured DLR feed retained |
| Heraeus | https://www.heraeus.com/en/group/career/students/students.html | 404 | Skipped supplied link: HTTP 404 |
| Merck KGaA | https://www.merckgroup.com/en/careers/students.html | — | Skipped supplied link: The operation was aborted due to timeout; existing catalogue entry left unchanged |
| Henkel | https://www.henkel.com/careers/students | 200 | Skipped: no usable public vacancy feed verified |
| E.ON SE | https://www.eon.com/en/careers/students.html | 403 | Skipped supplied link: HTTP 403 |
| RWE | https://www.rwe.com/en/career/students | 404 | Skipped supplied link: HTTP 404 |
| Siemens Healthineers | https://www.siemens-healthineers.com/en-us/careers/students | 200 | Skipped: no usable public vacancy feed verified |
| Trumpf | https://www.trumpf.com/en_INT/career/students/ | 503 | Skipped supplied link: HTTP 503 |
| Schaeffler | https://www.schaeffler.com/en/career/students/ | 404 | Skipped supplied link: HTTP 404 |
| Miele | https://www.miele.com/en/com/career-1685.htm | 404 | Skipped supplied link: HTTP 404 |
| Zeiss (Carl Zeiss AG) | https://www.zeiss.com/career/en/students.html | 404 | Skipped supplied link: HTTP 404 |
| DHL / Deutsche Post | https://careers.dhl.com/global/en/students | 404 | Skipped supplied link: HTTP 404 |
| SICK AG | https://www.sick.com/de/en/jobs-career/students | 404 | Skipped supplied link: HTTP 404 |
| Festo | https://www.festo.com/en/careers/students | 403 | Skipped supplied link: HTTP 403 |
| KUKA | https://www.kuka.com/en-de/careers | 200 | Skipped: no usable public vacancy feed verified |
| Software AG | https://www.softwareag.com/en_corporate/company/careers.html | 200 | Skipped: parked, error, or challenge page |
| Vodafone Germany | https://careers.vodafone.de/students | 200 | Skipped: no usable public vacancy feed verified |
| adidas | https://careers.adidas-group.com/students | — | Skipped supplied link: The operation was aborted due to timeout |
| Deutsche Börse | https://www.deutsche-boerse.com/dbg-en/careers/students | 200 | Skipped: no usable public vacancy feed verified |
| Commerzbank | https://www.commerzbank.com/en/hauptnavigation/karriere/students.html | 200 | Skipped: no usable public vacancy feed verified; existing catalogue entry left unchanged |
| MTU Aero Engines | https://www.mtu.de/careers/ | 200 | Skipped: no usable public vacancy feed verified |
| Wacker Chemie | https://www.wacker.com/cms/en-us/career/career.html | 404 | Skipped supplied link: HTTP 404 |
| Evonik | https://careers.evonik.com/en/students | 200 | Skipped: no usable public vacancy feed verified |
| Fresenius | https://www.fresenius.com/careers | 200 | Skipped: no usable public vacancy feed verified |
| SGL Carbon | https://www.sglcarbon.com/en/career/ | 404 | Skipped supplied link: HTTP 404 |

Entries without a URL (such as “see above” or unspecified university departments) are references, not additional sources. No endpoints were invented for them.
