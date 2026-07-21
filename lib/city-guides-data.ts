export type CityGuide = {
  slug: string
  code: string
  cityName: string
  state: string
  intro: string
  neighborhoods: string
  seasons: string
  howToFind: string
  faqs: { q: string; a: string }[]
}

export const CITY_GUIDES: Record<string, CityGuide> = {
  'new-york': {
    slug: 'new-york',
    code: 'NYC',
    cityName: 'New York',
    state: 'NY',
    intro:
      'New York City is America\'s undisputed free music capital, with hundreds of no-cover performances happening every week across five boroughs. From the grand stages of Central Park SummerStage to spontaneous subway platform jazz, the city treats live music as a public utility rather than a luxury. Whether you\'re a longtime resident or visiting for the first time, you\'ll find world-class talent performing for free on almost any day of the year.',
    neighborhoods:
      'Central Park is ground zero for free outdoor concerts. SummerStage runs from June through September across multiple park locations citywide, with a flagship stage at Rumsey Playfield in Central Park that has headlined acts ranging from Afrobeat legends to indie rock darlings — always free, first-come-first-served. Bryant Park, just off 42nd Street in Midtown, hosts its Bryant Park Picnic Performances series on Monday evenings throughout summer, drawing office workers and tourists alike onto the lawn for jazz, classical, and contemporary pop.\n\nBrooklyn punches well above its weight. Prospect Park SummerScreen combines outdoor film and live music on summer Wednesdays, while the Prospect Park Bandshell hosts free Celebrate Brooklyn! concerts from late spring through August — one of the oldest free concert series in the country. McCarren Park in Williamsburg is the hub for neighborhood arts events, and the waterfront at WNYC Transmitter Park hosts occasional pop-up performances with the Manhattan skyline as backdrop.\n\nIn Queens, Forest Hills Stadium occasionally opens free community days, and Flushing Meadows–Corona Park hosts Latin music festivals and community concerts serving the borough\'s diverse population. Staten Island\'s Snug Harbor Cultural Center and Botanical Garden stages free performances in its historic music hall grounds during summer weekends. The High Line, threading through Chelsea and Hell\'s Kitchen, features pop-up musical performances as part of its public programming year-round.',
    seasons:
      'Summer (June–August) is peak season, with SummerStage, Celebrate Brooklyn!, and Bryant Park Picnic Performances all running simultaneously. The parks fill up early for popular acts — arrive 30–45 minutes ahead. Independence Day weekend brings multiple free outdoor concert events across all boroughs.\n\nSpring and fall offer smaller but often more intimate free shows. Lincoln Center Out of Doors runs in late July and August with free performances on the plaza. The New York Philharmonic\'s free Concerts in the Parks each summer draws tens of thousands to Central Park, Prospect Park, and Van Cortlandt Park. Winter indoors: Jazz at Lincoln Center hosts occasional free concerts in the atrium at Columbus Circle, and the Metropolitan Museum of Art runs free Friday evening concerts in the Great Hall.',
    howToFind:
      'The Parks Department\'s free concert calendar at nycgovparks.org covers all borough events. SummerStage\'s own website lists the full season lineup in April. For jazz specifically, check the Village Vanguard and Blue Note\'s free late-night sets and the Lincoln Center Jazz calendar. Brooklyn Vegan and Gothamist post weekly free show roundups. Our listing page tracks verified free concerts across all five boroughs.',
    faqs: [
      {
        q: 'Do I need tickets for SummerStage concerts in Central Park?',
        a: 'Most SummerStage events are walk-up free with no tickets required — just show up and find a spot on the lawn. A small number of benefit concerts require tickets; those are clearly marked on the SummerStage website. The free shows are first-come-first-served, so popular acts fill the lawn quickly.',
      },
      {
        q: 'What\'s the best free music neighborhood in New York City?',
        a: 'It depends on the season. In summer, Central Park and Prospect Park host the largest free concerts. Year-round, the East Village and Lower East Side have the most bars with no-cover live music on weekday evenings. Williamsburg and Bushwick in Brooklyn have a thriving free DIY show scene, often announced on social media.',
      },
      {
        q: 'Are there free concerts in NYC during winter?',
        a: 'Yes, though fewer than summer. Jazz at Lincoln Center hosts free events in the atrium at Frederick P. Rose Hall. The Metropolitan Museum of Art runs free Friday evening performances. Many bars in the East Village, West Village, and Williamsburg have no-cover live music year-round, particularly on weeknights.',
      },
    ],
  },

  'los-angeles': {
    slug: 'los-angeles',
    code: 'LA',
    cityName: 'Los Angeles',
    state: 'CA',
    intro:
      'Los Angeles\'s near-perfect outdoor climate and deep reservoir of working musicians make it one of the best cities in the world for free live music. The city\'s sprawl means great free shows are spread across dozens of neighborhoods — from Grand Park\'s downtown stage to the beach cities\' summer concert series. LA\'s music scene spans every genre imaginable, and an enormous number of shows are genuinely free, thanks to parks departments, arts nonprofits, and radio stations that have long subsidized public performance.',
    neighborhoods:
      'Downtown LA has Grand Park as its civic music anchor. The park\'s main stage at Grand Avenue hosts free concerts on major holidays and throughout summer, with the downtown skyline serving as backdrop. The Pershing Square Signature Series brought free concerts to the historic square before its renovation — watch for its return. Little Tokyo and the Arts District host pop-up performances during gallery walks and seasonal festivals.\n\nWest Hollywood and Silver Lake have multiple bars and small venues with free live music nightly. The Troubadour\'s patio occasionally hosts free acoustic sets, and the bars along Sunset Strip host free showcase nights for emerging artists. Silver Lake\'s Sunset Junction area has a density of music venues that regularly waive cover on slower weeknights. Echo Park is home to frequent free outdoor shows at McCabe\'s Guitar Shop (ticketed but sometimes free) and in the park itself.\n\nThe beach cities deliver some of LA\'s most consistent free summer programming. Santa Monica Pier Twilight Concert Series runs Friday evenings through August, drawing massive crowds for free shows at the iconic pier stage. Venice Beach has boardwalk performers year-round, and the city\'s Levitt Pavilion Santa Monica hosts 50 free concerts each summer. Hermosa Beach, Manhattan Beach, and Redondo Beach all run their own summer concert series at city parks, typically on Saturday evenings.',
    seasons:
      'Summer (June–September) is the golden season, with the Santa Monica Pier Twilight series, Levitt Pavilion, and dozens of park concert series all running simultaneously. The weather is reliably perfect. Grand Performances at California Plaza in downtown runs free midday and evening concerts from June through September on weekdays — a beloved lunchtime escape for workers.\n\nSpring brings free concerts as part of neighborhood festivals across the city. The Korean Festival, Fiesta Broadway, and various cultural celebrations feature free live music stages. Fall weather remains concert-friendly, and October often sees free shows tied to LA\'s arts events like the Hammer Museum\'s Friday evening free concerts and the Museum of Contemporary Art\'s programming.',
    howToFind:
      'LA Parks (laparks.org) lists city-run concert series across all neighborhoods. Grand Performances (grandperformances.org) publishes its full summer schedule in April. For beach city shows, check Santa Monica\'s visitSantaMonica.com and individual city parks departments. LAist and LA Weekly maintain weekly free show calendars. Our listings page tracks verified upcoming free concerts across the greater LA area.',
    faqs: [
      {
        q: 'Is the Santa Monica Pier Twilight Concert Series always free?',
        a: 'Yes — the Twilight Concert Series at the Santa Monica Pier is completely free with no tickets required. Shows run Friday evenings from late June through August. The pier fills up quickly for popular headliners, so arriving 45–60 minutes early is recommended for a good spot.',
      },
      {
        q: 'Where can I find free live music in LA year-round?',
        a: 'For year-round free music, look to Silver Lake, Echo Park, and West Hollywood bars with no-cover policies on weeknights. The Hammer Museum in Westwood hosts free evening concerts and events throughout the year. Grand Performances (California Plaza, downtown) runs from June through September. The Getty Center occasionally hosts free live music in its garden.',
      },
      {
        q: 'What genres are most common at free LA concerts?',
        a: 'Free concerts in LA cover an exceptionally wide range — the summer park series typically feature world music, Latin, jazz, and R&B to appeal to diverse audiences. The beach city series lean toward classic rock, pop, and country covers. Bar shows in Silver Lake and Echo Park skew indie rock, folk, and experimental. Grand Performances programs jazz, world music, and contemporary classical.',
      },
    ],
  },

  chicago: {
    slug: 'chicago',
    code: 'CHI',
    cityName: 'Chicago',
    state: 'IL',
    intro:
      'Chicago has an unmatched tradition of free public music rooted in its blues, jazz, and gospel heritage. The city\'s park system runs some of the most ambitious free concert programming in the country, and Grant Park\'s Millennium Park stage is a world-class outdoor venue that any city would envy. From the blues clubs of the South Side to the folk bars of Lincoln Square, free music is woven into Chicago\'s civic identity in a way that sets it apart from most American cities.',
    neighborhoods:
      'The Loop and lakefront are Chicago\'s free music heart. Millennium Park\'s Jay Pritzker Pavilion, designed by Frank Gehry, hosts the Grant Park Music Festival — a 10-week, three-nights-a-week run of free classical and jazz concerts from mid-June through August that draws audiences of 10,000. The Chicago Blues Festival at Petrillo Music Shell in Grant Park is one of the world\'s largest free music events, drawing 500,000 over a long weekend each June. Chicago SummerDance fills Spirit of Music Garden in Grant Park on summer evenings with free lessons and live music.\n\nThe North Side neighborhoods deliver free music in smaller, more intimate settings. Lincoln Square is Chicago\'s German-heritage neighborhood and has multiple bars that feature free folk, acoustic, and Americana shows, particularly on weekends. Andersonville hosts annual street festivals with free music stages. Wicker Park and Bucktown have dozens of bars that waive cover on weeknights, especially earlier in the evening, featuring emerging local artists in rock, indie, and hip-hop.\n\nThe South Side\'s blues and gospel heritage is still alive. The Hyde Park neighborhood hosts free University of Chicago arts events, and the South Shore Cultural Center runs free outdoor concerts in its lakefront park. Bronzeville\'s cultural organizations stage free jazz and soul performances tied to the neighborhood\'s Harlem Renaissance legacy.',
    seasons:
      'Chicago\'s summers are intense and packed with free music. The Grant Park Music Festival runs June through August. The Chicago Jazz Festival takes over Millennium Park for Labor Day weekend — free, outdoor, world-class. The Taste of Chicago food festival includes multiple free live music stages. The Chicago Folk & Roots Festival at Welles Park in July features free performances.\n\nWinter brings free indoor programming: the Chicago Cultural Center, a free public building with stunning Tiffany glass domes, hosts regular free concerts year-round. The Chicago Symphony Orchestra occasionally offers free Community Concerts. Many bars in Andersonville, Lincoln Square, and Logan Square maintain free music nights through the cold months.',
    howToFind:
      'The Chicago Park District\'s calendar at chicagoparkdistrict.com is the definitive source for park-based events. Millennium Park\'s own website (millenniumpark.org) lists the full summer concert season in spring. The Chicago Reader\'s listings section covers smaller free shows at bars and venues. Time Out Chicago maintains a free events roundup. Our listings page tracks verified upcoming concerts across Chicagoland.',
    faqs: [
      {
        q: 'Is the Grant Park Music Festival really free?',
        a: 'Yes — the Grant Park Music Festival at the Jay Pritzker Pavilion in Millennium Park is entirely free with no tickets required. The festival runs Wednesday, Friday, and Saturday evenings from mid-June through August. Bring a blanket and arrive early for popular performances; the great lawn fills up quickly.',
      },
      {
        q: 'When is the Chicago Blues Festival and is it free?',
        a: 'The Chicago Blues Festival takes place over three to four days in June at Petrillo Music Shell in Grant Park. It is completely free with no tickets or wristbands required. The festival features multiple stages with performances running from early afternoon through evening. It\'s one of the largest free music festivals in the world.',
      },
      {
        q: 'What are the best neighborhoods for free live music bars in Chicago?',
        a: 'Lincoln Square has a strong tradition of free folk, bluegrass, and acoustic shows at bars like Huettenbar. Wicker Park and Bucktown have many bars with no-cover live music on weeknights. Logan Square has a thriving DIY music scene with frequent free shows. The South Side blues clubs in Bridgeport and around Blue Chicago occasionally have free early-evening sets.',
      },
    ],
  },

  dallas: {
    slug: 'dallas',
    code: 'DAL',
    cityName: 'Dallas',
    state: 'TX',
    intro:
      'Dallas has developed a surprisingly robust free music scene despite its reputation as a city defined by big budgets and bigger shows. The Arts District — one of the largest in the country — stages free outdoor performances throughout the year, and Deep Ellum\'s dense concentration of live music bars makes it easy to drift from venue to venue without spending a dollar on cover. North Texas weather is warm enough for outdoor concerts nine months of the year.',
    neighborhoods:
      'The Dallas Arts District, anchored by the AT&T Performing Arts Center and the Meyerson Symphony Center, is the city\'s most concentrated zone for free cultural programming. The Annette Strauss Artist Square hosts free outdoor concerts adjacent to the Meyerson, and the Klyde Warren Park — an urban green space built over the Woodall Rodgers Freeway — has become the city\'s most-used free concert venue, hosting events almost every weekend year-round. Its Weekend Concert Series runs from spring through fall.\n\nDeep Ellum, just east of downtown, is the historic soul of Dallas music. The neighborhood\'s clubs and bars along Elm Street and Commerce Street have been central to Texas blues and rock since the 1920s. While most Deep Ellum shows have covers, the strip hosts frequent free showcases, particularly during the Deep Ellum Arts Festival and on Thursday evenings when bars push free early-evening sets to build crowds. Main Street Garden Park in downtown hosts free concert events tied to Arts District programming.\n\nOak Cliff, across the Trinity River, has emerged as a growing hub for Latin music, folk, and indie rock. Bishop Arts District bars host occasional free shows, and the neighborhood\'s street festivals always feature live music. Las Colinas and Frisco in the northern suburbs run well-organized summer concert series at their respective parks and town squares.',
    seasons:
      'Spring (March–May) and fall (September–November) are Dallas\'s best outdoor concert seasons. Klyde Warren Park\'s programming peaks during these shoulder seasons when temperatures are comfortable. The AT&T Performing Arts Center\'s free Sounds of the Season events run in the plaza through the fall. Summer is hot but not impossible — most summer concerts are scheduled in the evening and located outdoors.\n\nThe Deep Ellum Arts Festival in April is the city\'s largest free music event, with multiple outdoor stages. The State Fair of Texas in October includes free live music on multiple stages inside the fairgrounds (though admission is required to enter).',
    howToFind:
      'Klyde Warren Park\'s website (klydewarrenpark.org) lists its full events calendar. The City of Dallas Parks and Recreation department lists outdoor concert events at dallasopendata.com. The Dallas Observer\'s event listings cover Deep Ellum and smaller shows. Dallas Morning News maintains a free events calendar. Our listings page tracks verified free concerts across the Dallas metro.',
    faqs: [
      {
        q: 'Is Klyde Warren Park free?',
        a: 'Yes — Klyde Warren Park is a free public space, and all of its regular weekend programming including concerts, fitness classes, and events is free to attend. No tickets or reservations are needed for the regular concert series. Special events may occasionally have ticketed components, but the park itself and its routine programming are always open and free.',
      },
      {
        q: 'What\'s the best way to find free music in Deep Ellum?',
        a: 'Deep Ellum free shows are largely announced close to the date on venue social media accounts. Thursday evenings often have free early-set music at bars before the cover charge kicks in later. The Deep Ellum Arts Festival each April transforms the entire neighborhood into a free outdoor music event with multiple stages. Follow Deep Ellum\'s neighborhood social accounts for announcements.',
      },
      {
        q: 'Does Dallas have free outdoor concerts in summer?',
        a: 'Yes, though summer heat pushes most outdoor concerts to evening hours. Klyde Warren Park runs its concert series on summer evenings. The Dallas Arboretum and Botanical Garden runs Thursday evening concerts (admission required to the garden). Several suburban cities including Frisco, Allen, and Plano run well-organized free summer concert series at their parks.',
      },
    ],
  },

  houston: {
    slug: 'houston',
    code: 'HOU',
    cityName: 'Houston',
    state: 'TX',
    intro:
      'Houston\'s free music scene reflects the city\'s extraordinary cultural diversity — a place where tejano, zydeco, blues, Vietnamese pop, and West African highlife can all be heard in free public settings on the same weekend. The Hermann Park area and Discovery Green are the city\'s outdoor music anchors, while Midtown and Montrose neighborhoods sustain a year-round bar music culture with frequent no-cover shows. Houston is also one of the few cities where free blues and zydeco shows at neighborhood clubs remain a living tradition.',
    neighborhoods:
      'Discovery Green, the 12-acre park at the edge of downtown, is Houston\'s most dynamic free music venue. The park runs concerts nearly every weekend year-round — its small stage hosts everything from Latin jazz brunches to indie rock shows, and the programming is thoughtfully curated to reflect Houston\'s international population. Admission is always free; bring a blanket or grab one of the park\'s rental chairs.\n\nMontrose is Houston\'s arts neighborhood and has a dense concentration of bars and venues with no-cover live music. The stretch along Westheimer and its side streets includes several venues that feature free shows on weeknights. The Museum District adjacent to Montrose hosts free events tied to the Museum of Fine Arts Houston, the Menil Collection, and the Rothko Chapel — all of which program free public music and performance events.\n\nEast Downtown (EaDo) has emerged as the city\'s DIY music hub, with art spaces and converted warehouses hosting free shows on weekends. Midtown\'s bars cluster around the Midtown Park area and host frequent free shows, especially on Thursday and Friday evenings. The Heights neighborhood has a family-friendly weekend farmers\' market scene with live music that doubles as a free concert every Saturday morning.',
    seasons:
      'Houston\'s subtropical climate makes year-round outdoor concerts possible, though summer humidity means most outdoor events are scheduled for evening hours. Discovery Green runs programming 12 months a year. The Houston Livestock Show and Rodeo (February–March) includes a massive free outdoor music component for those who don\'t buy tickets to the main arena shows.\n\nHouston\'s signature free music event is the Free Press Summer Festival season — the Free Press Houston covers free shows extensively. The Houston Greek Festival, Houston International Festival, and numerous neighborhood festivals throughout fall and spring feature free music stages. Fall and spring evenings in Houston are exceptionally pleasant for outdoor concerts.',
    howToFind:
      'Discovery Green\'s website (discoverygreenpark.com) lists its full concert calendar. The Houston Parks and Recreation Department lists events at houstontx.gov. Free Press Houston and Houstonia magazine maintain free event listings. The Menil Collection and Rothko Chapel both list their free music events on their own websites. Our listings page tracks verified free concerts across Houston.',
    faqs: [
      {
        q: 'Are Discovery Green concerts always free?',
        a: 'Yes — Discovery Green\'s regular concert programming is free to attend. The park hosts free shows nearly every weekend and on many weekday evenings. Some special events or festivals held at Discovery Green may have ticketed components, but these are clearly marked. The park\'s Lawn stage and Annalee & Lawrence Calvert Stage both host free events throughout the year.',
      },
      {
        q: 'Where can I find free zydeco music in Houston?',
        a: 'Houston has a long zydeco tradition rooted in the city\'s Louisiana Creole community. Free zydeco shows happen most frequently at Frenchie\'s Original Creole Restaurant and similar establishments in the Third Ward and Southeast Houston. Cultural festivals including the Houston Livestock Show and Rodeo often feature free zydeco performances outside the main paid venue.',
      },
      {
        q: 'Is Houston too hot for outdoor concerts in summer?',
        a: 'Summer outdoor concerts in Houston are scheduled in the evening (typically starting at 7 or 8 pm) when temperatures drop into the mid-80s. Humidity remains, but most concert-goers find it manageable with a cold drink. Discovery Green has shade trees and misters. Spring and fall evenings are ideal for outdoor shows.',
      },
    ],
  },

  philadelphia: {
    slug: 'philadelphia',
    code: 'PHI',
    cityName: 'Philadelphia',
    state: 'PA',
    intro:
      'Philadelphia has one of the East Coast\'s most underrated free music scenes, shaped by its deep soul, jazz, and classical traditions and sustained by institutions like the Mann Center and Penn\'s Landing. The city\'s compact geography means free shows in Center City, South Philly, Fishtown, and West Philadelphia are all within easy reach of each other, and the bar culture in Fishtown and Northern Liberties includes a healthy number of no-cover live music nights throughout the week.',
    neighborhoods:
      'Penn\'s Landing on the Delaware River waterfront is Philadelphia\'s biggest free outdoor concert venue. The Great Plaza at Penn\'s Landing hosts free concerts throughout summer, particularly around major holidays and during the Blue Cross RiverRink summer season. The Spruce Street Harbor Park at Penn\'s Landing is a beloved summer gathering spot that integrates live music into its programming.\n\nFishtown and Northern Liberties have become the city\'s primary bar music districts. Fishtown\'s Girard Avenue strip includes venues like Kung Fu Necktie that have free shows regularly, and the neighborhood\'s art spaces and bars host frequent free shows on weekdays. Northern Liberties\' 2nd Street corridor has a similar density of music bars. Both neighborhoods trend toward indie rock, folk, and experimental music.\n\nCenter City\'s Rittenhouse Square hosts free concerts in the park during summer, and the Benjamin Franklin Parkway — the grand boulevard connecting City Hall to the Philadelphia Museum of Art — transforms into a music stage during the Made in America Festival (Labor Day weekend, partially free viewing areas) and various city events. West Philadelphia\'s Clark Park hosts neighborhood concerts in its outdoor gathering space throughout summer.',
    seasons:
      'Summer is peak season, with Penn\'s Landing, Rittenhouse Square, and the Parkway all hosting free events. The Philadelphia Folk Festival in late August is one of the oldest and largest folk festivals in the country — the main stage events require tickets, but there\'s substantial free acoustic music in the parking lot and along the roads.\n\nThe Philadelphia Orchestra occasionally offers free outdoor concerts at Mann Center, where a hillside area outside the venue provides a free listening experience for those who don\'t buy seats. Winter in Philadelphia means moving indoors: the Pennsylvania Academy of the Fine Arts, the Free Library of Philadelphia, and the Barnes Foundation all host occasional free music events.',
    howToFind:
      'The Philly Parks and Recreation department lists events at phila.gov/recreation. Penn\'s Landing\'s calendar is at delawareriverwaterfront.com. The Philadelphia Inquirer and Billy Penn maintain comprehensive free events calendars. For bar shows, Fishtown\'s neighborhood website and Northern Liberties Neighbors Association social media post free show announcements. Our listings page tracks verified free concerts across Philadelphia.',
    faqs: [
      {
        q: 'Are there free concerts at Penn\'s Landing in Philadelphia?',
        a: 'Yes — the Great Plaza at Penn\'s Landing on the Delaware River waterfront hosts free concerts throughout summer, especially around Memorial Day, Fourth of July, and Labor Day weekends. The Spruce Street Harbor Park, adjacent to Penn\'s Landing, integrates live music into its summer programming. Check the Delaware River Waterfront Corporation\'s calendar for specific dates.',
      },
      {
        q: 'What\'s the best neighborhood for free live music bars in Philadelphia?',
        a: 'Fishtown is Philadelphia\'s densest free music bar district, with venues along Girard Avenue and adjacent side streets hosting no-cover shows several nights a week. Northern Liberties\' 2nd Street has a similar vibe. For jazz, South Philly\'s Italian Market area has occasional free shows, and West Philadelphia has free music tied to the University of Pennsylvania\'s arts programming.',
      },
      {
        q: 'Can I hear the Philadelphia Orchestra for free?',
        a: 'The lawn area outside the Mann Center for the Performing Arts in West Fairmount Park allows free listening to performances happening inside — bring a blanket, sit on the hillside, and enjoy the sound. The Philadelphia Orchestra also occasionally hosts free community concerts; check their website for community engagement programming.',
      },
    ],
  },

  atlanta: {
    slug: 'atlanta',
    code: 'ATL',
    cityName: 'Atlanta',
    state: 'GA',
    intro:
      'Atlanta\'s free music scene is as diverse as the city itself, blending Southern gospel, hip-hop, jazz, and indie rock across a landscape of parks, plazas, and neighborhood bars. The city\'s warm climate allows outdoor concerts from March through November, and Piedmont Park — Atlanta\'s answer to Central Park — anchors the city\'s outdoor music calendar alongside the ever-active Old Fourth Ward. Atlanta benefits from a large base of working musicians across every genre, keeping the supply of free live performances consistently high.',
    neighborhoods:
      'Piedmont Park in Midtown is Atlanta\'s most beloved outdoor concert venue. The park hosts the Atlanta Jazz Festival each Memorial Day weekend — one of the largest free jazz festivals in the Southeast, drawing 300,000 over several days. Concerts in the Park and various neighborhood events fill the park throughout summer. The park\'s Performance Lawn provides a natural amphitheater setting.\n\nthe Old Fourth Ward, MLK\'s historic neighborhood, has evolved into one of Atlanta\'s most vibrant arts districts. Krog Street Market and the Beltline trail adjacent to it host frequent free music events, particularly on weekends. The Atlanta BeltLine — a 22-mile trail loop connecting 45 neighborhoods — has become a major venue for free outdoor performance, with regular programming during the warmer months.\n\nLittle Five Points and East Atlanta Village are the city\'s DIY music hubs, with bars and venues frequently offering free early-evening shows. Both neighborhoods lean toward rock, punk, and experimental music, with occasional hip-hop and electronic shows. West Midtown\'s Westside Provisions District hosts free outdoor programming in its plazas, and Inman Park\'s neighborhood festival each spring is one of the largest free music events in the city.',
    seasons:
      'Atlanta\'s springs are exceptional for outdoor concerts — the Atlanta Jazz Festival at Memorial Day weekend is the season\'s centerpiece. The weather from March through May is reliably pleasant, and fall from September through November is equally good. Summer heat and humidity push some outdoor shows to covered or evening venues.\n\nThe Atlanta Music Midtown festival in September is a major paid event, but the weeks surrounding it produce a surge of free shows across the city. The Inman Park Festival in April and the Little Five Points Halloween Festival include substantial free music programming.',
    howToFind:
      'Atlanta Parks and Recreation lists events at atlantaga.gov. The Atlanta Jazz Festival has its own website with the full lineup published in April. The Atlanta BeltLine calendar (beltline.org) lists trail events. Creative Loafing Atlanta is the go-to source for free show listings, and Do404 Atlanta covers local music events comprehensively. Our listings page tracks verified free concerts across Atlanta.',
    faqs: [
      {
        q: 'Is the Atlanta Jazz Festival really free?',
        a: 'Yes — the Atlanta Jazz Festival at Piedmont Park over Memorial Day weekend is entirely free with no tickets required. It\'s one of the largest free jazz festivals in the US. Multiple stages run simultaneously from late morning through evening across the park. Some premium viewing areas are ticketed, but the vast majority of the festival is open-access.',
      },
      {
        q: 'What free concerts happen on the Atlanta BeltLine?',
        a: 'The Atlanta BeltLine hosts frequent free events along the Eastside Trail and at various access points throughout the warmer months. The BeltLine Lantern Parade, Aboretum events, and various neighborhood programming include live music. Check beltline.org\'s events calendar for scheduled performances. Many events are announced within a week of the show date.',
      },
      {
        q: 'Are there free music events in Atlanta year-round?',
        a: 'Yes, though the peak outdoor season is spring and fall. Year-round free music is most consistent at bars in Little Five Points, East Atlanta Village, and along Edgewood Avenue in Old Fourth Ward. The High Museum of Art hosts free Friday evening programs that sometimes include live music, and many of Atlanta\'s cultural institutions program free events throughout the year.',
      },
    ],
  },

  miami: {
    slug: 'miami',
    code: 'MIA',
    cityName: 'Miami',
    state: 'FL',
    intro:
      'Miami\'s free music scene is inseparable from its outdoor culture and Latin heritage. The city\'s year-round warmth means outdoor concerts are never more than a few weeks away, and the Latin music tradition — spanning Cuban son, Colombian vallenato, Haitian kompa, and Brazilian samba — keeps free public performances on stages across Little Havana, Little Haiti, and Wynwood throughout the year. Miami\'s arts and nightlife convergence also produces a steady stream of free early-evening shows at galleries and venues that haven\'t yet charged cover.',
    neighborhoods:
      'Little Havana\'s Calle Ocho is the city\'s Latin music heartland. The monthly Viernes Culturales (Cultural Fridays) event transforms Calle Ocho into a free outdoor street festival with live Cuban, salsa, and Latin jazz performances on the last Friday of every month. The Calle Ocho Festival in March is one of the world\'s largest free outdoor music events, covering 23 blocks of the street with stages featuring Latin music across all subgenres.\n\nWynwood has evolved from purely visual arts to include music as part of its gallery walk culture. Second Saturdays and various gallery opening events in Wynwood regularly feature free live music in the streets and at gallery spaces. The Wynwood Art Walk is a monthly event that integrates music into the arts experience. The Design District nearby hosts occasional free outdoor programming.\n\nBayside Marketplace in downtown Miami provides free live music from its stage overlooking Biscayne Bay most weekends. South Beach\'s Lincoln Road pedestrian mall attracts buskers and occasionally organizes free performance events. The Pérez Art Museum Miami (PAMM) on the Biscayne Bay waterfront hosts free Thursday evening programs that include live music and DJs, and Bayfront Park hosts the free Ultra Music Festival pre-parties and various community concerts.',
    seasons:
      'Miami\'s winter and spring (November–April) are the prime free concert season, with comfortable temperatures and low humidity perfect for outdoor events. The Calle Ocho Festival in March is the city\'s biggest free music event. Ultra Music Festival, though largely ticketed, generates substantial free spillover events in Wynwood and the Design District.\n\nSummer in Miami is hot and humid with afternoon thunderstorms, pushing many outdoor events to early morning or evening hours. Miami\'s Art Basel week in December is remarkable for free music events — galleries, hotels, and public spaces host dozens of free performances across the city during the art fair.',
    howToFind:
      'Miami-Dade County Parks lists events at miamidade.gov/parks. The City of Miami\'s events calendar is at miamigov.com. The Miami New Times is the best source for free show listings. Viernes Culturales\' own website lists each month\'s performers. For Wynwood events, follow the Wynwood BID social media accounts. Our listings page tracks verified free concerts across Miami.',
    faqs: [
      {
        q: 'What is Viernes Culturales and is it free?',
        a: 'Viernes Culturales (Cultural Fridays) is a free monthly street festival on Calle Ocho in Little Havana, held on the last Friday of every month. The event features live Cuban music, salsa, and Latin jazz performances, along with art galleries, food vendors, and cultural programming. It typically runs from 7 to 11 pm. Admission is free; just show up.',
      },
      {
        q: 'Is the Calle Ocho Festival free?',
        a: 'Yes — the Calle Ocho Festival, held each March in Little Havana, is one of the world\'s largest free outdoor music events. The festival covers 23 blocks of SW 8th Street (Calle Ocho) with multiple music stages, food vendors, and cultural programming. No tickets or wristbands are required; it\'s open to the public.',
      },
      {
        q: 'Are there free concerts in Miami during Art Basel week?',
        a: 'Absolutely — Art Basel week in early December is one of Miami\'s best times for free music. Hotels, galleries, and art spaces throughout Wynwood, the Design District, and South Beach host dozens of free events with live music. Many of these events are invite-only, but a substantial number are publicly accessible. Check Do305 and the Miami New Times Art Basel guides for the best free events each year.',
      },
    ],
  },

  'san-francisco': {
    slug: 'san-francisco',
    code: 'SF',
    cityName: 'San Francisco',
    state: 'CA',
    intro:
      'San Francisco\'s free music scene punches well above the city\'s compact size, with a rich tradition of public performance stretching from the Haight-Ashbury\'s free concerts of the 1960s to today\'s Stern Grove Festival and Golden Gate Park programming. The city\'s arts funding model and dense population of working musicians sustains a year-round supply of free shows, and neighborhoods like the Mission, the Castro, and the Haight regularly host community events with live music stages.',
    neighborhoods:
      'Golden Gate Park is San Francisco\'s outdoor concert landmark. The Stern Grove Festival has been running free outdoor concerts in the park\'s eucalyptus grove for over 85 years — a Sunday afternoon tradition from June through August featuring symphony orchestras, world music acts, and pop performers. The Sharon Meadow within Golden Gate Park hosts the Outside Lands Music Festival (ticketed) but serves as a free public space for outdoor events during most of the year. Speedway Meadow is the site of various free community concerts.\n\nThe Mission District has the city\'s densest free music culture. Dolores Park — the city\'s unofficial free concert venue — attracts informal and organized free performances throughout the warmer months. Neighborhood bars along Mission Street and Valencia Street host no-cover shows frequently, particularly Tuesday through Thursday evenings. The 16th Street BART plaza area has regular busking and informal performance.\n\nNorth Beach is San Francisco\'s jazz neighborhood, with Washington Square Park hosting the annual San Francisco Jazz Festival outdoor events and informal performances year-round. Coit Tower and the adjacent parks host occasional free programming. The Haight-Ashbury maintains a few bars with free live music, and Amoeba Music on Haight Street occasionally hosts free in-store performances.',
    seasons:
      'The Stern Grove Festival (June–August) is San Francisco\'s free music anchor. Despite the city\'s famously foggy summers, the grove is naturally sheltered and warm. Arrive 90 minutes early for popular shows — the grove fills to capacity. Outside of Stern Grove, summer weekends at Dolores Park often include informal musical gatherings.\n\nThe San Francisco Jazz Festival in late October and November includes some free outdoor events. The Chinese New Year parade in February features free music, and Carnaval in the Mission in late May includes free live stages. Year-round, the San Francisco Symphony occasionally offers free community concerts, and the San Francisco Opera has free outdoor performances.',
    howToFind:
      'Stern Grove Festival\'s website (sterngrove.org) lists the full summer lineup when announced in spring. SF Recreation and Parks (sfrecpark.org) lists city-managed events. The SF Chronicle\'s free events guide and KQED\'s arts calendar are good secondary sources. For Mission shows, follow the SF Music Commission and local venue social media. Our listings page tracks verified free concerts in San Francisco.',
    faqs: [
      {
        q: 'How do I get tickets to the Stern Grove Festival?',
        a: 'The Stern Grove Festival is completely free — no tickets, no reservations. Just show up at the Stern Grove amphitheater at 19th Avenue and Sloat Boulevard in time for the show. Concerts typically start at 2 pm on Sundays. The grove is a natural bowl shaded by eucalyptus and redwood trees; bring a picnic blanket, layers (it can be cool), and snacks.',
      },
      {
        q: 'What free music events happen at Golden Gate Park?',
        a: 'Beyond the Stern Grove Festival (which is technically just south of the park), Golden Gate Park hosts free concerts at Sharon Meadow and Speedway Meadow for city events, festivals, and community programming throughout the year. The Hardly Strictly Bluegrass Festival each October at the park is one of the world\'s great free music events — three days of bluegrass, country, and Americana with no tickets required.',
      },
      {
        q: 'Is the Hardly Strictly Bluegrass Festival free?',
        a: 'Yes — the Hardly Strictly Bluegrass Festival held each fall (usually early October) in Golden Gate Park is entirely free. The festival runs Friday through Sunday with six stages and dozens of performers from bluegrass, country, folk, and Americana. No tickets, no wristbands — just show up. It\'s one of the most generously funded free music events in America.',
      },
    ],
  },

  boston: {
    slug: 'boston',
    code: 'BOS',
    cityName: 'Boston',
    state: 'MA',
    intro:
      'Boston\'s free music scene is shaped by its extraordinary concentration of universities, its deep folk and classical traditions, and the City of Boston\'s commitment to public arts funding. The Hatch Shell on the Charles River Esplanade is one of America\'s most iconic outdoor concert stages, and the annual Boston Pops Fireworks Spectacular is just the most famous of a summer full of free performances there. Boston also benefits from the constant turnover of talented student musicians at Berklee, NEC, and Harvard who perform publicly at low or no cost.',
    neighborhoods:
      'The Charles River Esplanade is Boston\'s free concert centerpiece. The Hatch Shell amphitheater on the Esplanade hosts the Boston Pops Fourth of July concert (one of the country\'s most-watched free concerts), as well as the Esplanade Concerts series running most summer evenings from June through August. The setting — with the river, the Cambridge skyline, and the city lights as backdrop — is extraordinary. The entire Esplanade pathway along the river hosts informal music during warm months.\n\nThe South End is Boston\'s arts-forward neighborhood with galleries and bars that host frequent free shows. Columbus Avenue and Tremont Street have music venues that waive cover on weeknights. The weekly SoWa Open Market in the South End (summer Sundays) includes live music. Fenway\'s Lansdowne Street strip has multiple music venues, some of which offer free early-evening shows before cover charges apply.\n\nCambridge\'s Harvard Square is a legendary busking destination with one of the most active street musician communities in the country. Harvard Square also hosts free concerts in the Square and at the adjacent Cambridge Common. Porter Square and Davis Square in Cambridge and Somerville have bars and venues with frequent free shows. Berklee College of Music and New England Conservatory both present free student and faculty recitals throughout the academic year — a remarkable resource for free classical and jazz.',
    seasons:
      'Summer peaks from July 4th (Hatch Shell Pops concert) through August with daily Esplanade concerts. The Boston Calling Music Festival in May is a paid event, but the surrounding weeks generate free spillover shows. Cambridge\'s fall festival season includes the Cambridge Arts River Festival (free) and Harvard Square Oktoberfest (free live music stages).\n\nWinter brings Berklee and NEC\'s free concert season, with recitals and ensemble performances several times per week at both campuses. The Isabella Stewart Gardner Museum hosts free musical Sunday concerts in its extraordinary courtyard through the fall.',
    howToFind:
      'The Esplanade Association\'s website (esplanadeassociation.org) lists Hatch Shell events. Boston Parks and Recreation lists city events. The Boston Globe\'s free events guide and DigBoston cover smaller shows and venues. For student concerts, Berklee\'s and NEC\'s event calendars are publicly accessible. Our listings page tracks verified free concerts across Boston.',
    faqs: [
      {
        q: 'When is the Boston Pops Fourth of July concert and is it free?',
        a: 'The Boston Pops Fireworks Spectacular at the Hatch Shell on the Charles River Esplanade is held on July 4th every year and is entirely free. Gates open in the morning; serious fans arrive very early to claim lawn space. The concert begins in the evening, followed by a fireworks display over the river. It\'s one of America\'s most-attended free music events.',
      },
      {
        q: 'Where can I hear free classical music in Boston?',
        a: 'Boston has exceptional free classical music options. Berklee College of Music and New England Conservatory both present free student and faculty recitals throughout the academic year — check their event websites. The Boston Symphony Orchestra occasionally offers free open rehearsals. The Isabella Stewart Gardner Museum hosts free Sunday concerts in its courtyard. The Handel & Haydn Society sometimes offers community concerts.',
      },
      {
        q: 'Is Harvard Square good for free music?',
        a: 'Harvard Square has one of the best busking communities in the country, particularly around the main plaza and the T station entrance. Buskers are licensed and auditioned by the city. Beyond busking, Harvard Square hosts free concert events in the Square throughout the year, including a summer concert series. The Cambridge Common adjacent to Harvard Yard hosts outdoor events with live music.',
      },
    ],
  },

  'washington-dc': {
    slug: 'washington-dc',
    code: 'DC',
    cityName: 'Washington',
    state: 'DC',
    intro:
      'Washington DC may be America\'s most underrated city for free live music. The nation\'s capital funds the arts with a generosity that reflects its civic ambitions, and institutions like the Kennedy Center, the Smithsonian, the National Mall, and the Library of Congress all produce free public music programming at a scale that most cities\' paid venues can\'t match. Every week of the year, there are multiple genuinely world-class free concerts happening in DC, indoors and outdoors.',
    neighborhoods:
      'The National Mall is America\'s greatest free outdoor performance space. The Smithsonian Folklife Festival in late June and early July draws hundreds of thousands with free music, culture, and food from regions featured each year. The Lincoln Memorial grounds host concerts tied to major national events. The Kennedy Center\'s Millennium Stage presents free performances every single day at 6 pm in the Grand Foyer — a remarkable commitment to accessible arts that has been running since 1997.\n\nU Street NW is DC\'s historic jazz and soul neighborhood, often called "Black Broadway." Landmark venues like the Howard Theatre and the Lincoln Theatre are ticketed, but the neighborhood\'s bars and smaller venues regularly host free shows, particularly on weekdays. The U Street Music Hall and Café Saint-Ex host free events. The 9:30 Club occasionally opens ticketed shows to a free standing-room audience.\n\nCapitol Hill and Eastern Market have a strong neighborhood arts culture with free music at Eastern Market itself on Saturdays and Sundays, including folk, jazz, and bluegrass. The neighborhood\'s bars along Pennsylvania Avenue SE host free early-evening shows. Georgetown waterfront and the C&O Canal towpath host occasional outdoor concerts tied to the neighborhood\'s arts institutions and restaurants.',
    seasons:
      'Summer on the National Mall is spectacular — the Smithsonian Folklife Festival (late June/early July), various military band concerts on the Capitol steps, and the National Symphony Orchestra\'s free Labor Day concert on the Capitol Lawn are seasonal highlights. The Kennedy Center\'s Millennium Stage runs 365 days a year at 6 pm.\n\nFall brings the Adams Morgan Day festival (free outdoor music stages in September) and the H Street Festival (one of DC\'s best free outdoor music events in September). Winter means moving indoors to the Kennedy Center, the Smithsonian American Art Museum (SAAM), and the Library of Congress, all of which run free concert series.',
    howToFind:
      'The Kennedy Center\'s Millennium Stage calendar (kennedy-center.org) is updated monthly — all performances are free at 6 pm in the Grand Foyer. The Smithsonian\'s events calendar (si.edu/events) lists all free museum concerts. DC\'s cultural calendar (washington.org) covers public events. The Washington Post\'s free events guide is comprehensive. Our listings page tracks verified free concerts across Washington DC.',
    faqs: [
      {
        q: 'What is the Kennedy Center Millennium Stage?',
        a: 'The Millennium Stage at the Kennedy Center presents free performances every day at 6 pm in the Grand Foyer. These are full performances — typically 45 to 75 minutes — ranging from jazz ensembles to classical chamber music to world music to emerging pop artists. No tickets are needed; just arrive at the Kennedy Center before 6 pm and take a seat in the foyer. It\'s been running every single day since 1997.',
      },
      {
        q: 'Is the Smithsonian Folklife Festival free?',
        a: 'Yes — the Smithsonian Folklife Festival on the National Mall is entirely free. Held annually in late June and early July, the festival runs for 10 days and features live music, crafts, food, and cultural demonstrations from regions selected each year. There is no admission charge; just walk onto the National Mall. It is one of the country\'s premier free music and culture events.',
      },
      {
        q: 'Where is the best free live music in Washington DC year-round?',
        a: 'The Kennedy Center Millennium Stage (daily at 6 pm, free) is the most consistent source of free music in DC. U Street NW and Adams Morgan have bars with free music several nights a week. The Smithsonian museums — particularly the American Art Museum, the National Portrait Gallery, and the Natural History Museum — host free evening concerts. Eastern Market in Capitol Hill has free music on weekend mornings.',
      },
    ],
  },

  seattle: {
    slug: 'seattle',
    code: 'SEA',
    cityName: 'Seattle',
    state: 'WA',
    intro:
      'Seattle\'s free music scene reflects the city\'s paradoxical nature: it\'s perpetually overcast and introverted, yet it has produced more significant music per capita than almost any other American city. The live music culture here runs deep, and while summer outdoor events are abundant, Seattle also distinguishes itself by maintaining year-round free shows in bars, libraries, and arts spaces that don\'t depend on good weather. The city\'s strong arts funding and large population of working musicians keep the supply high across genres from indie folk to jazz to electronic.',
    neighborhoods:
      'Seattle Center — the 74-acre complex left over from the 1962 World\'s Fair — is the city\'s free cultural anchor. The Mural Amphitheatre hosts free concerts as part of the Seattle Center Concerts program throughout summer. The Northwest Folklife Festival, held over Memorial Day weekend at Seattle Center, is the Pacific Northwest\'s largest free folk festival, with over 100 free music performances across multiple stages. Bumbershoot (Labor Day weekend) is largely ticketed, but the surrounding neighborhood has free music.\n\nCapitol Hill is Seattle\'s music neighborhood, dense with venues and bars that host free shows on weeknights. Pike and Pine streets have a concentration of music bars, and the neighborhood\'s art spaces host frequent free shows, particularly in the DIY and experimental music community. Broadway\'s bars have free earlier-evening shows before cover charges apply. The annual Capitol Hill Block Party (July) includes free street stages alongside its ticketed main stage.\n\nBallard is Seattle\'s folk and roots music hub, with several bars along Market Street hosting free acoustic and bluegrass shows. The Ballard Farmers\' Market on Sunday mornings regularly features live music. Fremont, the self-proclaimed "center of the universe," has the Fremont Sunday Market with live music and hosts the Summer Solstice Parade and Festival each June with free music stages.',
    seasons:
      'Summer in Seattle is glorious and brief (July–September), with Seattle Center concerts, waterfront events, and neighborhood festivals all competing for attention. The Northwest Folklife Festival at Memorial Day is the season opener. Seattle PrideFest in late June includes substantial free outdoor music.\n\nWinter is where Seattle distinguishes itself — the city\'s bars and venues don\'t slow down when rain returns. Capitol Hill bars maintain free music nights year-round. The Earshot Jazz Festival in October and November includes some free events. The Seattle Symphony\'s Benaroya Hall presents occasional free community concerts.',
    howToFind:
      'Seattle Parks and Recreation (seattle.gov/parks) lists outdoor concert events. Seattle Center\'s website lists Mural Amphitheatre events. The Stranger\'s music section is the definitive source for Seattle free show listings, updated weekly. KEXP, Seattle\'s legendary music radio station, maintains an online events calendar and occasionally presents free in-studio performances streamed online. Our listings page tracks verified free concerts across Seattle.',
    faqs: [
      {
        q: 'Is the Northwest Folklife Festival free?',
        a: 'Yes — the Northwest Folklife Festival at Seattle Center over Memorial Day weekend is entirely free to attend. There is no admission charge. The festival features over 100 performances across multiple stages, ranging from traditional folk to world music to contemporary singer-songwriter. Donations are appreciated but never required.',
      },
      {
        q: 'What\'s the best neighborhood for free music bars in Seattle?',
        a: 'Capitol Hill is Seattle\'s best neighborhood for bars with no-cover live music, particularly on Tuesday through Thursday evenings. Pike and Pine streets and the surrounding blocks have the highest density of music venues. Fremont and Ballard are good for folk and acoustic music, with several bars hosting free shows on weekend afternoons and early evenings.',
      },
      {
        q: 'Does Seattle have free concerts even in winter?',
        a: 'Yes — Seattle\'s music culture is notably weather-independent. Capitol Hill and Fremont bars maintain free music nights year-round. The Seattle Public Library system hosts free music events at branches across the city. The Seattle Art Museum and Seattle Asian Art Museum host free First Thursday programming that includes live music. KEXP\'s lobby at Seattle Center is a warm, free gathering space with music playing continuously.',
      },
    ],
  },

  portland: {
    slug: 'portland',
    code: 'PDX',
    cityName: 'Portland',
    state: 'OR',
    intro:
      'Portland has cultivated one of America\'s most distinctive free music cultures — eclectic, community-rooted, and defiantly anti-commercial. The city\'s DIY ethic means free shows happen in bars, coffee shops, community gardens, and art collective spaces as naturally as they do in parks and plazas. Last Thursday on Alberta Street is perhaps the purest expression of Portland\'s free music culture: a monthly street festival that turns an entire neighborhood into a performance space without a single admission charge.',
    neighborhoods:
      'Alberta Street is the epicenter of Portland\'s free outdoor music culture. Last Thursday on Alberta (the last Thursday of each month, May through September) transforms Alberta Street into a free street festival with dozens of live performances happening simultaneously — on porches, in front yards, on sidewalk stages, and in gallery spaces. The event is entirely free and entirely community-organized. Alberta Street\'s bars and music venues maintain free shows year-round.\n\nthe Mississippi Avenue neighborhood hosts the Mississippi Street Fair each summer with free music stages and has a collection of bars and small venues with regular free shows. The Division Street corridor in Southeast Portland has a dense concentration of bars and restaurants with free music, particularly on Thursday evenings. Hawthorne Boulevard has similar energy, with the Clinton Street area hosting frequent free acoustic and folk shows.\n\nDowntown Portland\'s Pioneer Courthouse Square — nicknamed "Portland\'s Living Room" — hosts free concerts and events nearly every weekend during summer. Director Park adjacent to Powell\'s Books has free programming as well. The Arlene Schnitzer Concert Hall occasionally presents free outdoor events on its plaza, and the Portland Art Museum\'s First Thursday gallery walks include free music.',
    seasons:
      'Summer (June–September) is Portland\'s free music zenith. Last Thursday runs on its summer schedule, Pioneer Courthouse Square is busy with events, and the Tom McCall Waterfront Park hosts major free events including the Portland Rose Festival, Blues Festival (historically free, check current status), and Waterfront Blues Festival. The Oregon Zoo Summer Concert Series is ticketed, but the surrounding park area allows free listening.\n\nFall brings the Portland Jazz Festival (some free events) and continuing Last Thursday through September. Winter in Portland means coffee shop shows, bar music nights, and the city\'s strong small-venue culture carrying the free music tradition indoors.',
    howToFind:
      'Portland Parks & Recreation lists outdoor events at portland.gov. Last Thursday\'s schedule is posted on the Alberta Main Street website and neighborhood social media. The Portland Mercury is the best source for free show listings citywide. Don\'t overlook the Portland Community Radio station XRAY.fm\'s events listings for DIY and small-venue shows. Our listings page tracks verified free concerts across Portland.',
    faqs: [
      {
        q: 'What is Last Thursday on Alberta Street?',
        a: 'Last Thursday is a free monthly street festival on NE Alberta Street in Portland\'s Alberta Arts District, held on the last Thursday of each month from May through September. The event features live music performances throughout the street, art installations, food carts, and community gatherings. No tickets or admission — just show up and wander. It typically runs from 6 to 9 pm.',
      },
      {
        q: 'Is the Waterfront Blues Festival in Portland free?',
        a: 'The Waterfront Blues Festival at Tom McCall Waterfront Park traditionally charged a small donation (typically 2 cans of food) rather than a ticket price, making it effectively free for most attendees. Check the current year\'s festival website for any changes to the admission policy. The festival runs over the Fourth of July weekend and is one of the top blues festivals in the country.',
      },
      {
        q: 'Where are the best free music venues in Portland?',
        a: 'For consistent free music, Alberta Street\'s bars and music spaces are the best starting point. Mississippi Avenue\'s bars host frequent free shows, and the Division Street corridor in Southeast Portland is strong for folk and acoustic music. McMenamins venues (Crystal Ballroom, Kennedy School) occasionally host free events. The Goodfoot Lounge has legendary free dance nights with live music on certain evenings.',
      },
    ],
  },

  denver: {
    slug: 'denver',
    code: 'DEN',
    cityName: 'Denver',
    state: 'CO',
    intro:
      'Denver\'s free music scene benefits from Colorado\'s outdoor culture and the city\'s strong arts funding, resulting in a summer concert landscape that makes the most of the 300+ days of sunshine. Civic Center Park in the heart of downtown and Red Rocks Amphitheatre\'s free community days are among Colorado\'s great free music experiences, while the RiNo Arts District and LoHi neighborhoods sustain year-round free bar music that tracks Denver\'s rapid growth into a major American music city.',
    neighborhoods:
      'Civic Center Park, the formal green space between the State Capitol and Denver Art Museum, anchors the city\'s free outdoor concert calendar. The Civic Center EATS food truck series includes free live music throughout summer. The Denver Day of Rock each summer transforms 16th Street Mall into a multi-stage free rock concert event. Larimer Square — Denver\'s historic commercial district — hosts free events throughout the year, and Union Station\'s plaza is a gathering point with occasional free performances.\n\nRiNo (River North Art District) is Denver\'s fastest-growing arts neighborhood and has become a hub for free creative events. The Source market, various gallery spaces, and outdoor patios host free music throughout summer and fall. RiNo\'s First Friday Art Walk includes free music at many gallery stops. The neighborhood\'s bars along Brighton Boulevard and Walnut Street have frequent free shows.\n\nBallpark neighborhood around Coors Field has free concerts on game-day plazas, and Lower Downtown (LoDo) has a dense concentration of bars with free music on weeknights. South Broadway — "SoBo" — is Denver\'s dive bar music district with multiple venues featuring free shows regularly. The Tennyson Street corridor in Berkeley has a smaller but active free music culture.',
    seasons:
      'Summer is Denver\'s free music peak. The Colorado Symphony\'s free outdoor concerts at Civic Center and Red Rocks (occasional free or cheap shows) draw large crowds. The Bluebird Theater, Ogden Theatre, and other established venues run free parking-lot or plaza shows during Denver\'s active summer arts festival season.\n\nThe Denver Arts Week each October includes free events across the city. The Great American Beer Festival in October draws free outdoor music to the convention center plaza area. Winter drives the scene indoors, where Denver\'s strong bar music culture continues uninterrupted on South Broadway, LoDo, and RiNo.',
    howToFind:
      'Denver Parks and Recreation (denvergov.org) lists outdoor concert events. The Denver Day of Rock has its own website. Westword, Denver\'s alt-weekly, maintains the most comprehensive free show listings. The Colorado Symphony lists any free community concerts on their website. For RiNo events, the RiNo Art District\'s website and social media are the best sources. Our listings page tracks verified free concerts across Denver.',
    faqs: [
      {
        q: 'Does Red Rocks Amphitheatre have free concerts?',
        a: 'Red Rocks Amphitheatre\'s main concert season requires tickets. However, Red Rocks hosts occasional free or very low-cost "Film on the Rocks" events and community programming. Denver\'s City Parks and Recreation department runs free yoga classes at Red Rocks on weekend mornings during summer, which are worth the trip even without music. Check the Red Rocks website for any free community events each season.',
      },
      {
        q: 'What is the Denver Day of Rock?',
        a: 'Denver Day of Rock is a free annual outdoor concert festival on 16th Street Mall in downtown Denver. Multiple stages run simultaneously with local and regional rock and alternative acts performing throughout the day. It\'s organized by AEG and takes place each spring (typically May). The event is free and open to the public; just show up.',
      },
      {
        q: 'What neighborhoods have the best free bar music in Denver?',
        a: 'South Broadway ("SoBo") has the densest concentration of bars with free live music in Denver, particularly on weeknights. LoDo (Lower Downtown) around Larimer Street and 15th has multiple venues with free shows. RiNo\'s bars along Brighton Boulevard are strong for free indie and electronic shows. The Tennyson Street corridor in Berkeley is the best for free folk and acoustic music.',
      },
    ],
  },

  austin: {
    slug: 'austin',
    code: 'AUS',
    cityName: 'Austin',
    state: 'TX',
    intro:
      'Austin is the Live Music Capital of the World by self-proclamation and by genuine substance — the city has more live music venues per capita than almost anywhere on earth, and a remarkable number of those shows are completely free. Sixth Street, the Red River Cultural District, and the South Congress corridor function as open-air free music zones on weekend nights, where live bands play simultaneously at dozens of bars without a cover charge. SXSW\'s official programming requires wristbands, but the unofficial free showcases during that week can be even better.',
    neighborhoods:
      'Sixth Street (East 6th Street, specifically) is Austin\'s most famous free music corridor. On Thursday, Friday, and Saturday nights, bars along the strip have live bands performing without cover from around 9 pm through 2 am. Simply walk the block from Red River to Congress, pop into any open door, and you\'ll find live music. The format varies — country, blues, rock, hip-hop — and the quality is remarkably high given that many performers are professional working musicians.\n\nThe Red River Cultural District, the block of venues along Red River Street between 6th and 11th, is Austin\'s roots music and indie venue cluster. Mohawk\'s outdoor stage has occasional free shows. Stubb\'s Waller Creek Amphitheater, one of Austin\'s most beloved outdoor venues, holds a free backyard area accessible without tickets for some shows. The Parish and other venues in the district run free early-evening showcases.\n\nSouth Congress Avenue (SoCo) has a different energy — more boutique and craft-focused — but integrates free music into its shopping and restaurant district culture, particularly during the annual Austin City Limits Music Festival setup weeks and neighborhood events. Zilker Park, home of the Austin City Limits Music Festival (ticketed), hosts various free community events throughout the year. Barton Springs Pool at Zilker occasionally has free music events on its lawn.',
    seasons:
      'SXSW in March is Austin\'s musical zenith. While badge-holders pay thousands, the free unofficial showcases across dozens of venues and outdoor stages run simultaneously during the day — no badge required. This is genuinely one of the best free music experiences in America. Austin City Limits Music Festival in October is ticketed, but the surrounding period brings many free outdoor shows.\n\nSummer (June–August) is hot but the outdoor venues on 6th Street and Stubb\'s outdoor space compensate with open-air cooling. Free outdoor concerts at Barton Springs and various parks happen throughout the warmer months. Austin\'s year-round warm climate means 6th Street free shows run 365 days a year.',
    howToFind:
      'The Austin Chronicle is the essential source for Austin free show listings, particularly during SXSW. Austin\'s Parks and Recreation department lists outdoor events. The Do512 events platform covers all Austin concerts. Red River Cultural District has its own events calendar. Stubb\'s Amphitheater lists any free backyard shows on their website. Our listings page tracks verified free concerts across Austin.',
    faqs: [
      {
        q: 'What free music happens during SXSW in Austin?',
        a: 'The unofficial SXSW showcases are where much of the best free music happens. Throughout SXSW week (mid-March), dozens of venues, outdoor stages, and parking lots host free showcases — often with lineups as strong as the official programming. Some free showcases require RSVPs (via websites like Do512 or SXSW\'s own unofficial showcase listings), but many are walk-up free. Outdoor stages at Stubb\'s outdoor area, outside venues along Red River, and pop-up spaces throughout East Austin run free shows throughout the day.',
      },
      {
        q: 'Is there a cover charge on 6th Street in Austin?',
        a: 'Most bars on 6th Street (particularly East 6th) operate without a cover charge for live music nights. Just walk in off the street. Some bars on the "dirty 6th" section closer to Congress charge cover on busy weekend nights; walk further east or to Red River for more consistently free shows. The live music starts around 9 pm on Thursday through Saturday and continues past midnight.',
      },
      {
        q: 'Does Austin have free outdoor concerts outside of 6th Street?',
        a: 'Yes — Stubb\'s Waller Creek Amphitheater has a free outdoor area for certain shows. Barton Springs Pool and Zilker Park host free events throughout the year. The Long Center for the Performing Arts hosts free outdoor "Under the Stars" events. The Paramount Theatre and other Austin venues occasionally host free outdoor programming. Keep an eye on city parks programming and the Austin Chronicle free events calendar.',
      },
    ],
  },

  nashville: {
    slug: 'nashville',
    code: 'NSH',
    cityName: 'Nashville',
    state: 'TN',
    intro:
      'Nashville is one of America\'s great free music cities by virtue of simple geography and economics: the bars of Lower Broadway (Honky Tonk Row) have been hosting free live country music every day of the year, all day long, for decades. Walking down Broadway on any afternoon and hearing three different country bands simultaneously through open doors is a Nashville rite of passage, and it costs nothing. Beyond the honky tonks, Nashville\'s East Nashville neighborhood, 12South, and the broader Music City ecosystem sustain free music from bluegrass to blues to hip-hop.',
    neighborhoods:
      'Lower Broadway — specifically the stretch of 2nd to 5th Avenue — is America\'s most concentrated free live music zone. Legendary honky tonks like Tootsie\'s Orchid Lounge, Robert\'s Western World, and Legends Corner have multiple levels of live music running continuously from 10 am until 3 am, 365 days a year. Every performer plays for tips and exposure — there is never a cover charge, ever. Walking in off the street and hearing a professional-level country or bluegrass band is the default Nashville experience.\n\nEast Nashville, across the Cumberland River, has emerged as the city\'s alternative music hub with a very different character from Broadway. Bars along Gallatin Avenue, Greenwood Avenue, and the Five Points intersection host free indie rock, folk, and Americana shows regularly. The neighborhood\'s arts events, including the annual East Nashville Tomato Art Fest in August, feature free outdoor music stages. East Nashville bars tend to have free music on weekdays when the Broadway bars are less crowded.\n\n12South neighborhood has developed a boutique free music culture tied to its restaurant and coffee shop scene. Various venues and outdoor spaces host free events throughout the year. The Gulch neighborhood\'s bars occasionally feature free music, and the Wedgewood-Houston arts district has free music tied to its gallery and art space events.',
    seasons:
      'Nashville free music is year-round on Broadway — rain or shine, hot or cold. The CMA Music Festival in June brings enormous paid events but also generates free outdoor music across the city. The Americana Music Festival in September brings the city\'s folk and roots community together with some free programming. The Nashville Film Festival and various cultural events throughout the year include free music stages.\n\nSpring and fall offer the best weather for wandering from honky tonk to honky tonk on Broadway. Summer is hot and busy with tourists; Broadway remains active but packed. Winter sees fewer tourists and a more authentic Broadway experience.',
    howToFind:
      'Honky Tonk Row requires no planning — just show up on Broadway any day of the year. For East Nashville shows, the Nashville Scene is the best source for free listings. Nashville\'s Parks and Recreation department lists outdoor events. The Nashville Arts Blog covers gallery and arts space music events. Do615 covers Nashville events comprehensively. Our listings page tracks verified free concerts across Nashville.',
    faqs: [
      {
        q: 'Is music on Lower Broadway (Honky Tonk Row) always free?',
        a: 'Yes — every bar on Lower Broadway charges no cover at any time. Tootsie\'s, Robert\'s Western World, Legends Corner, Honky Tonk Central, and dozens of others feature live bands every day from mid-morning through the early hours, all free to enter. Musicians perform for tips; bring cash to show appreciation. There is no dress code, no reservation, and no cover charge — ever.',
      },
      {
        q: 'What time do bands start playing on Broadway in Nashville?',
        a: 'Live music on Broadway starts around 10 am at most honky tonks and runs continuously through 3 am. Bands typically play 45-minute sets with short breaks, rotating through multiple performers throughout the day and evening. The mid-afternoon to evening hours (3–9 pm) tend to have the best balance of quality and crowd size. Weekends are busier; weekdays are more relaxed.',
      },
      {
        q: 'Are there free music options in Nashville beyond the honky tonks?',
        a: 'Yes — East Nashville\'s Five Points area has bars with free music most nights, trending toward indie and Americana. The Tennessee State Museum and Bicentennial Capitol Mall State Park occasionally host free outdoor concerts. The Country Music Hall of Fame museum has a free outdoor plaza with occasional performances. Centennial Park hosts free concerts throughout summer, and the Nashville Public Library hosts free music events.',
      },
    ],
  },

  memphis: {
    slug: 'memphis',
    code: 'MEM',
    cityName: 'Memphis',
    state: 'TN',
    intro:
      'Memphis is where American music history lives and breathes in the open air. Beale Street — the birthplace of the blues — has free music pouring out of its bars every night of the week, and the city\'s deep connection to soul, gospel, and R&B means you can hear music with genuine historical roots for free on almost any given evening. The Memphis in May International Festival, the Beale Street Music Festival, and various outdoor events make Memphis one of the most music-rich cities in the South.',
    neighborhoods:
      'Beale Street Historic District is Memphis\'s free music heartland. The pedestrian strip from 2nd to 4th Street hosts live blues, soul, and R&B music at bars like B.B. King\'s Blues Club, Blues City Café, and Silky O\'Sullivan\'s every night of the week, with many bars hosting free music or very low cover charges. Blues musicians play on the street itself during major events. The District\' is a living museum of American music that charges nothing to enter.\n\nOrange Mound, South Memphis, and Binghampton have the city\'s authentic gospel and soul tradition — Sunday church services featuring extraordinary choral and gospel music are free public events at many of the city\'s historic churches. These aren\'t tourist experiences; they\'re living musical communities. South Main Arts District, a few blocks from Beale Street, has galleries and creative spaces that host free music events, particularly during monthly South Main Trolley Night events.\n\nCooperTown and Midtown Memphis have bars and arts spaces with free music that tilts toward indie, folk, and experimental. The Crosstown Concourse arts complex in Midtown hosts regular free community events with live music, and Overton Park\'s Grove is the city\'s beautiful outdoor concert space that hosts free events throughout spring and fall.',
    seasons:
      'Memphis in May brings the Beale Street Music Festival (ticketed) to Tom Lee Park, but the surrounding weeks have enormous amounts of free spillover music across Beale Street and the South Main district. The World Championship Barbecue Cooking Contest at the Memphis in May events includes free live music stages.\n\nFall brings the Cooper-Young Community Festival in September with free outdoor music stages in Midtown — one of the city\'s most beloved community events. The Memphis Music Heritage Festival, held at various times, celebrates the city\'s musical legacy with free outdoor programming. Winter is quiet for outdoor events but Beale Street never stops.',
    howToFind:
      'The Memphis Tourism Board (visitmemphis.com) lists major events. Memphis Flyer is the alt-weekly source for free show listings citywide. Beale Street\'s own website lists event programming. The South Main Association lists Trolley Night events and First Friday programming. Crosstown Concourse\'s website lists all free events at that venue. Our listings page tracks verified free concerts across Memphis.',
    faqs: [
      {
        q: 'Is Beale Street free to enter?',
        a: 'Yes — Beale Street is a public street and free to walk at any time. During major events, certain sections may be cordoned off with paid admission (typically during the Beale Street Music Festival and New Year\'s Eve), but regular nightly programming on Beale Street costs nothing to experience. Many bars charge no cover; some have a small cover on weekend nights. Blues musicians also perform on the street itself.',
      },
      {
        q: 'Can I hear live blues music in Memphis for free every night?',
        a: 'Yes — Beale Street has live blues and soul music every night of the week at multiple venues. The Blues City Café, Rum Boogie Café, Alfred\'s, and other bars typically have free music with no cover or a very small cover on Friday and Saturday nights. Sunday through Thursday is generally free music throughout the strip. Street musicians perform during busy evenings and on weekend afternoons.',
      },
      {
        q: 'What is the Memphis in May Beale Street Music Festival?',
        a: 'The Beale Street Music Festival is a ticketed three-day music festival at Tom Lee Park along the Mississippi River, typically held the first weekend of May as part of Memphis in May International Festival. Tickets are required for the festival grounds. However, free music happens simultaneously on Beale Street itself during festival weekend, and several surrounding venues host free concerts.',
      },
    ],
  },

  'new-orleans': {
    slug: 'new-orleans',
    code: 'NOLA',
    cityName: 'New Orleans',
    state: 'LA',
    intro:
      'New Orleans has the most extraordinary free music culture in America, full stop. Music here isn\'t scheduled or programmed — it erupts from the streets, second lines wind through neighborhoods without warning, and Jackson Square buskers play for the sheer joy of it at almost any hour. The city\'s tradition of jazz funerals, Mardi Gras Indian parades, brass band second lines, and French Quarter street performance means that free live music is an inescapable feature of daily life in a way that no other American city can replicate.',
    neighborhoods:
      'The French Quarter is the world\'s greatest free outdoor music district. Bourbon Street has live music streaming from bar doorways every night until the early hours, and while some bars charge cover, the music is audible from the street for free at all times. Jackson Square is perhaps the most consistently active free performance space in America — musicians, brass bands, and second line parades converge here at all hours, particularly on weekend afternoons. Street performers there include legitimate jazz masters.\n\nFrenchmen Street in the Marigny neighborhood, just outside the Quarter, is where New Orleans residents go for free live music. The three or four blocks of Frenchmen Street have multiple bars and clubs with live jazz, funk, and blues, many with no cover. The Spotted Cat Music Club, d.b.a., and Café Negril feature world-class local musicians, often with no cover charge at all. Weekend evenings on Frenchmen Street have an outdoor festival energy, with brass bands moving through the crowd.\n\nThe Tremé neighborhood, the oldest African American neighborhood in the country, is the historical home of jazz and the brass band tradition. Louis Armstrong Park in Tremé hosts free outdoor concerts, and Congo Square within the park is the ancestral home of American music — free public programming happens here throughout the year. The Mardi Gras Indian community parades through Tremé and Central City on Super Sunday (the Sunday before or after St. Joseph\'s Day in March), a free and spectacular public event.',
    seasons:
      'New Orleans free music has no off-season. The Jazz & Heritage Festival (JazzFest) in late April and early May is ticketed, but the two weeks surrounding it generate more free music across the city than any equivalent period. Second line parades happen nearly every Sunday from fall through spring, following a published schedule from the Social Aid and Pleasure Club Task Force.\n\nMardi Gras season (January–Fat Tuesday) includes free brass band performances at every parade and free music at virtually every bar. French Quarter Festival in April is larger than JazzFest and has historically featured more free outdoor stages. New Year\'s Eve on the Mississippi River and Thanksgiving are the city\'s biggest free outdoor music events of the year.',
    howToFind:
      'The Social Aid and Pleasure Club Task Force publishes the second line parade schedule for the season — available at saplctaskforce.com. The Offbeat Magazine (offbeat.com) is the authoritative source for New Orleans music events. WWOZ 90.7 FM\'s website lists free and ticketed events. French Quarter Festival\'s website publishes its free lineup in March. Our listings page tracks verified free concerts across New Orleans.',
    faqs: [
      {
        q: 'Is Frenchmen Street in New Orleans free?',
        a: 'Most bars on Frenchmen Street have no cover charge — just walk in and enjoy the music. The Spotted Cat Music Club, d.b.a., and Café Negril typically have no cover; a few may charge on busy weekend nights. The outdoor brass band performances that happen on the street itself are always free. Weekend evenings on Frenchmen Street have a spontaneous street festival quality with no admission.',
      },
      {
        q: 'What is a second line parade and how do I find one?',
        a: 'A second line parade is a New Orleans tradition where a social aid and pleasure club leads a brass band parade through neighborhood streets, with community members joining behind (the "second line"). Parades happen most Sundays from fall through spring, typically starting at 1 or 2 pm. The route and starting location are published by the Social Aid and Pleasure Club Task Force (saplctaskforce.com) and updated on WWOZ\'s website. Admission is free; just follow the music.',
      },
      {
        q: 'Is the French Quarter Festival free?',
        a: 'Yes — the French Quarter Festival in April is entirely free. It is one of the largest free music festivals in the US, featuring over 1,700 musicians on dozens of stages throughout the French Quarter over four days. No tickets or wristbands are required. Just walk into the French Quarter during festival weekend. It is often considered the city\'s best music festival precisely because it\'s free and community-focused.',
      },
    ],
  },

  minneapolis: {
    slug: 'minneapolis',
    code: 'MIN',
    cityName: 'Minneapolis',
    state: 'MN',
    intro:
      'Minneapolis has a music scene that dramatically exceeds what you might expect for a city of its size. The legacy of Prince — who recorded most of his catalog at Paisley Park in nearby Chanhassen — is felt in a city that takes music seriously at every level, from the indie rock clubs of the Warehouse District to the free summer concerts at Lake Harriet and Loring Park. Minneapolis\'s arts infrastructure, sustained by strong local philanthropy and a highly educated population, means free music programming is year-round and genuinely high quality.',
    neighborhoods:
      'The Lakes and Parks are Minneapolis\'s free music backbone. Lake Harriet Bandshell, one of the country\'s most charming free outdoor concert venues, hosts free concerts on summer evenings (Thursday through Sunday) and Sunday afternoon from early June through August. The concerts run every year without fail and draw families and music lovers in equal numbers. Loring Park hosts the Minneapolis Pride festival (one of the Midwest\'s largest LGBTQ+ celebrations) with substantial free music, and the park itself is a gathering point for outdoor events throughout summer.\n\nFirst Avenue and the Warehouse District are Minneapolis\'s rock and pop music epicenter. The famous First Avenue nightclub (where Prince filmed Purple Rain) has a parking ramp adjacent to it that hosts free outdoor shows on summer evenings. The surrounding block, including 7th Street Entry and its alley, has free and low-cost shows regularly. The Warehouse District\'s bars along 1st Avenue North and adjacent streets feature free music on weeknights.\n\nNortheast Minneapolis (NE) has become the city\'s arts and craft brewery hub, with brewery taprooms hosting free music throughout the week. The NE arts crawl and monthly Nordeast Art events include live music at galleries and bars. Midtown Global Market on Lake Street hosts free community events with music that reflect the neighborhood\'s extraordinary cultural diversity.',
    seasons:
      'Summer is the peak season, with Lake Harriet Bandshell running its full schedule and the Minneapolis Sculpture Garden hosting occasional free events. The Minnesota State Fair in late August and early September has free music on multiple stages throughout the fairgrounds (admission required to the fair). The Basilica Block Party in July is a partially ticketed outdoor event, but surrounding programming includes free shows.\n\nWinter in Minneapolis drives music indoors but doesn\'t stop it — the Walker Art Center, Minneapolis Institute of Art, and various brewery taprooms maintain regular free programming. The Holidazzle festival in December includes free outdoor music on Loring Park.',
    howToFind:
      'The Minneapolis Parks and Recreation Board lists events at minneapolisparks.org, including the Lake Harriet Bandshell schedule. City Pages (and its successor local arts coverage) maintains free event listings. The Walker Art Center\'s website lists free public programming. For NE Minneapolis shows, the Northeast Minneapolis Arts Association\'s calendar covers gallery and venue events. Our listings page tracks verified free concerts across Minneapolis.',
    faqs: [
      {
        q: 'How do I get to Lake Harriet Bandshell concerts?',
        a: 'Lake Harriet Bandshell is at 4135 W Lake Harriet Pkwy in Minneapolis. It\'s accessible by bike on the chain of lakes trails, by city bus, or by car with parking available in the adjacent lot (arrives early fill up for popular shows). Concerts are Thursday and Friday evenings at 7:30 pm, Saturday evenings at 8 pm, and Sunday afternoons at 2 pm and evenings at 6 pm, from early June through August. All concerts are free with no tickets required.',
      },
      {
        q: 'Does Minneapolis have free music in winter?',
        a: 'Yes — Minneapolis\'s bar and small venue music culture continues year-round regardless of weather. Brewery taprooms in Northeast Minneapolis host free music weekly. The Walker Art Center presents free public events throughout the year. The American Swedish Institute and various cultural centers host free community music events. First Avenue\'s parking ramp outdoor shows pause in winter, but the club\'s interior shows (ticketed) continue.',
      },
      {
        q: 'What is the Minneapolis music scene like?',
        a: 'Minneapolis has a remarkably strong indie rock and pop scene inherited partly from the Replacements and Hüsker Dü era and sustained by a steady pipeline of talent through the University of Minnesota and Macalester College. The city also has strong jazz, electronic, and hip-hop communities. Free shows skew toward indie rock, folk, and jazz, with the Lake Harriet series programming across classical, pop, and world music.',
      },
    ],
  },

  detroit: {
    slug: 'detroit',
    code: 'DET',
    cityName: 'Detroit',
    state: 'MI',
    intro:
      'Detroit\'s free music scene is deeply rooted in the city\'s extraordinary musical history — the birthplace of Motown, techno, and hardcore punk, home to a jazz and blues tradition that shaped American popular music. The Detroit Jazz Festival on Labor Day weekend is one of the world\'s greatest free jazz events, and the city\'s ongoing cultural renaissance has brought new free outdoor programming to Eastern Market, the Detroit Riverfront, and revitalized neighborhoods like Midtown and Corktown.',
    neighborhoods:
      'Eastern Market, the largest historic public market in the US, is Detroit\'s community music anchor. The Saturday market is accompanied by live music throughout the market sheds and adjacent parking areas from spring through fall. Eastern Market\'s Flower Day in May is one of the city\'s most beloved free events with substantial live music. Eastern Market After Dark events in summer bring free music and nightlife to the district.\n\nThe Detroit Riverfront has been transformed over the past decade into one of the city\'s best free outdoor gathering spaces. The Detroit Riverwalk events calendar includes free concerts at Milliken State Park and the Hart Plaza, which is the anchor venue for the Detroit Jazz Festival each Labor Day. The riverfront path extends miles along the waterfront with occasional pop-up performance.\n\nMidtown is Detroit\'s arts district, anchored by the Detroit Institute of Arts, Wayne State University, and the Michigan Science Center. The DIA hosts free concerts in its Rivera Court and on the museum plaza throughout the year. Corktown, the city\'s oldest neighborhood and home of the iconic Michigan Central Station, has become a bar and restaurant district with free music at venues along Michigan Avenue.',
    seasons:
      'Labor Day weekend is Detroit\'s free music zenith: the Detroit Jazz Festival at Hart Plaza on the riverfront features world-class jazz performances on multiple outdoor stages over four days, all completely free. It is consistently ranked among the top jazz festivals globally and the largest free jazz festival in the world.\n\nSummer brings Eastern Market programming and various Midtown arts events. The Movement Electronic Music Festival in May (ticketed) generates free spillover events in the surrounding areas. Winter drives programming indoors, but the Detroit Institute of Arts and various club shows continue.',
    howToFind:
      'The Detroit Jazz Festival (detroitjazzfest.com) publishes its full Labor Day weekend lineup in August. Eastern Market\'s website (easternmarket.com) lists events throughout the year. The Detroit Riverfront Conservancy lists events at detroitriverfront.org. Metro Times, Detroit\'s alt-weekly, has comprehensive free show listings. The DIA\'s website lists free programming at the museum. Our listings page tracks verified free concerts across Detroit.',
    faqs: [
      {
        q: 'Is the Detroit Jazz Festival really free?',
        a: 'Yes — the Detroit Jazz Festival at Hart Plaza on the Detroit Riverfront over Labor Day weekend is entirely free. No tickets, no wristbands, no charges of any kind. The festival features multiple outdoor stages running simultaneously over four days with jazz performances by world-class international and local artists. It is consistently cited as the world\'s largest free jazz festival.',
      },
      {
        q: 'What is the music scene like in Detroit beyond jazz?',
        a: 'Detroit is the birthplace of techno music, and the city\'s electronic music community hosts free events in clubs and arts spaces throughout the year. The Movement Electronic Music Festival (ticketed) in May is surrounded by free parties and events. Detroit also has a significant hip-hop scene with free shows, a growing indie rock community in Corktown and Midtown, and the ongoing influence of the Motown legacy in soul and R&B programming.',
      },
      {
        q: 'Are there free concerts at the Detroit Institute of Arts?',
        a: 'Yes — the Detroit Institute of Arts hosts free concerts and events in its Rivera Court and on the museum plaza throughout the year as part of its Friday Night Live series and other community programming. The DIA was one of the first American museums to make general admission free for Wayne, Oakland, and Macomb county residents. Check the DIA\'s website for its current events calendar.',
      },
    ],
  },

  'kansas-city': {
    slug: 'kansas-city',
    code: 'KC',
    cityName: 'Kansas City',
    state: 'MO',
    intro:
      'Kansas City has a jazz heritage that rivals New Orleans and Chicago, dating to the 1920s and 1930s when the city\'s 18th and Vine district was one of America\'s great jazz centers — Charlie Parker was born here, and Count Basie made his name in Kansas City\'s clubs. Today, that heritage sustains an active free music culture at the American Jazz Museum, in the Crossroads Arts District, and at the Power & Light District\'s outdoor stages. Kansas City\'s free music scene is quieter than its reputation deserves, which means shows are rarely overcrowded.',
    neighborhoods:
      '18th and Vine Historic Jazz District is Kansas City\'s sacred musical ground. The American Jazz Museum at 18th and Vine hosts free outdoor concerts in its adjacent parking lot and courtyard, particularly during the Kansas City Jazz & Heritage Festival. The Blue Room jazz club inside the museum has occasional free or low-cost evenings. The Gem Theater in the district hosts occasional free community concerts. Walking the 18th and Vine area evokes the neighborhood\'s golden era while offering current free music programming.\n\nThe Crossroads Arts District, Kansas City\'s contemporary arts hub centered around 18th Street and Baltimore Avenue, hosts the First Fridays art walk each month with free music at gallery spaces, bars, and outdoor areas. The Crossroads has become one of KC\'s most active free music zones, with bars along 18th Street and West Bottoms hosting free shows regularly. The Sprint Center (now T-Mobile Center) plaza and surrounding Crossroads area host free outdoor events tied to major concerts and city events.\n\nPower & Light District, KC\'s entertainment zone, has free outdoor music on its central stage most weekends during summer and fall. The Kansas City Royals and Chiefs game-day atmosphere generates free outdoor music at adjacent public spaces. Westport, Kansas City\'s bar district, has multiple venues with free music on weeknights.',
    seasons:
      'The Kansas City Jazz & Heritage Festival in June is the city\'s free music anchor — a multi-day outdoor event at 18th and Vine with free admission celebrating the city\'s jazz heritage with both local and nationally recognized performers. Summer brings outdoor concerts at Loose Park and various neighborhood events. The Plaza Art Fair in September in the Country Club Plaza area includes free music stages.\n\nKansas City hosts a late-fall free outdoor music season in October before winter sets in. The Sprint Center/T-Mobile Center plaza hosts free community events tied to the holiday season.',
    howToFind:
      'The American Jazz Museum\'s website (americanjazzmuseum.org) lists free concerts and events. Kansas City Parks and Recreation lists outdoor events. The Pitch is Kansas City\'s source for free show listings. The Crossroads KC events calendar covers First Friday and district events. Power & Light District\'s social media announces free outdoor shows. Our listings page tracks verified free concerts across Kansas City.',
    faqs: [
      {
        q: 'Is the American Jazz Museum in Kansas City free?',
        a: 'The American Jazz Museum at 18th and Vine charges admission for its galleries, but the Blue Room jazz club inside the museum has occasional free early-evening programming. The museum\'s outdoor courtyard and adjacent areas host free concerts, particularly during the Kansas City Jazz & Heritage Festival in June. Check the museum\'s events page for free programming.',
      },
      {
        q: 'What is First Fridays in the Crossroads District?',
        a: 'First Fridays is a monthly art walk in Kansas City\'s Crossroads Arts District on the first Friday of each month. Gallery spaces, studios, and venues throughout the district host free events with live music, art openings, and community programming. The event runs from about 6 to 10 pm; outdoor stages and parking lot performances add to the free music experience.',
      },
      {
        q: 'Where is the best free jazz in Kansas City today?',
        a: 'The Blue Room at the American Jazz Museum has occasional free programming and low-cost evenings. The Mutual Musicians Foundation, a historic jazz fraternal organization at 19th and Highland, holds legendary all-night jam sessions on weekends — technically a members club, but the community is welcoming. The Kansas City Jazz & Heritage Festival in June at 18th and Vine is the city\'s biggest free jazz event.',
      },
    ],
  },

  'st-louis': {
    slug: 'st-louis',
    code: 'STL',
    cityName: 'St. Louis',
    state: 'MO',
    intro:
      'St. Louis\'s free music scene is anchored by the Missouri Botanical Garden\'s Whitaker Music Festival — one of the country\'s most beloved free summer concert series — and by the extraordinary Gateway Arch National Park, which provides a spectacular backdrop for blues concerts each August. The city\'s Forest Park, one of the largest urban parks in America (bigger than Central Park), hosts the SLSO\'s free outdoor concert and various summer events, and the Soulard neighborhood sustains a blues bar culture with frequent free shows.',
    neighborhoods:
      'Forest Park is St. Louis\'s crown jewel and free music center. Art Hill at the west end of the park becomes the site of the St. Louis Symphony Orchestra\'s free outdoor concert each September — one of the city\'s most beloved annual events, drawing tens of thousands to the park\'s slope. The Muny, an 11,000-seat outdoor amphitheater in Forest Park, is America\'s largest outdoor musical theater and sets aside free seats at every performance for those who can\'t afford tickets — a remarkable public service.\n\nThe Missouri Botanical Garden in the Tower Grove neighborhood hosts the Whitaker Music Festival each Wednesday evening from late May through late July. The festival has featured an extraordinary range of performers and is completely free with regular paid garden admission or a low-cost concert-only ticket. It\'s one of the most sophisticated free concert series in the Midwest. Tower Grove Park across the street hosts its own free outdoor concerts.\n\nSoulard, St. Louis\'s historic French neighborhood, has a bar district with blues music most nights of the week. Soulard Mardi Gras in February is the second-largest Mardi Gras celebration in the US, with free outdoor music throughout the neighborhood. The BB\'s Jazz, Blues & Soups and Hammerstone\'s are Soulard staples with frequent free or low-cover shows.',
    seasons:
      'Summer is the core free music season: the Whitaker Festival (May–July), various Forest Park events, and the Gateway Arch Blues Festival in August. The Blues at the Arch event at Gateway Arch National Park in August is a spectacular free outdoor blues festival with the Arch as backdrop.\n\nThe fall SLSO concert at Art Hill in Forest Park is one of the city\'s most-attended free events. Spring brings the Tower Grove Art Festival and neighborhood events with free music. The St. Louis Jazz Festival in the spring and various Soulard events run through the winter.',
    howToFind:
      'The Missouri Botanical Garden\'s website (missouribotanicalgarden.org) lists the Whitaker Festival schedule. Forest Park Forever lists events at forestparkforever.org. Gateway Arch National Park\'s website (gatewayarch.com) lists free programming. St. Louis Magazine and Riverfront Times cover free show listings. The SLSO\'s website lists any free community concerts. Our listings page tracks verified free concerts across St. Louis.',
    faqs: [
      {
        q: 'Is the Whitaker Music Festival at the Missouri Botanical Garden free?',
        a: 'The Whitaker Music Festival runs Wednesday evenings from late May through late July at the Missouri Botanical Garden. Entry requires either a paid garden admission ($16–$24) or a concert-only ticket ($5). The music itself is free once you\'re in the garden — no additional concert charge. Children under 12 are free with a paying adult. It\'s one of the best-value summer concert experiences in the Midwest.',
      },
      {
        q: 'Can I see the SLSO perform for free in St. Louis?',
        a: 'Yes — the St. Louis Symphony Orchestra performs a free outdoor concert at Art Hill in Forest Park each September that draws enormous crowds. The event is completely free with no tickets required. The SLSO also occasionally offers other free community concerts; check the symphony\'s website for announcements. The Muny in Forest Park, while a ticketed theater, reserves free "top rows" seats for every performance.',
      },
      {
        q: 'What is the Blues at the Arch festival in St. Louis?',
        a: 'Blues at the Arch is a free outdoor blues festival held at Gateway Arch National Park in downtown St. Louis, typically in August. The festival features multiple performances on outdoor stages with the iconic Gateway Arch as backdrop. It is free to attend with no tickets required. The national park setting means the event is managed by the National Park Service alongside local arts organizations.',
      },
    ],
  },

  indianapolis: {
    slug: 'indianapolis',
    code: 'IND',
    cityName: 'Indianapolis',
    state: 'IN',
    intro:
      'Indianapolis has a free music scene that consistently surprises visitors expecting a quiet Midwestern city. The Cultural Trail — a biking and walking path connecting downtown neighborhoods — functions as a de facto outdoor performance corridor during summer events, and venues like Bottleworks District, the Monumental Mile, and the Fountain Square neighborhood provide year-round free music infrastructure. The city\'s growing arts investment has produced a summer outdoor concert season that rivals cities twice its size.',
    neighborhoods:
      'The Indianapolis Cultural Trail connects six downtown neighborhoods and serves as both a transit route and a venue for free outdoor performances during festivals and events. Mass Avenue ("Mass Ave"), one of the city\'s most vibrant arts streets, has galleries and restaurants that host free music during the monthly First Friday events and throughout the week. The corridor\'s outdoor spaces and patios create a free music zone several blocks long.\n\nFountain Square, a historic neighborhood southeast of downtown, is Indianapolis\'s most active free music district. The Fountain Square Theatre Building hosts the free Fountain Square Summer Concert Series, and the neighborhood\'s bars and restaurants along Virginia Avenue have free music on weeknights. The neighborhood\'s Saturday farmers\' market includes live music. The amphitheater at Garfield Park hosts free summer concerts for the southside community.\n\nBottleworks District, a redevelopment of the historic Coca-Cola bottling plant on Massachusetts Avenue, has become a hub for free community events with music. The surrounding Mass Ave corridor has multiple bars with free shows. White River State Park, adjacent to downtown, hosts the free Symphony on the Prairie concerts (Indiana State Symphony Society) during summer evenings.',
    seasons:
      'The Indy Jazz Fest in June includes some free outdoor performances. The Indiana State Fair in August has free music on multiple outdoor stages throughout the fairgrounds (admission required to the fair). Summer in Indianapolis has consistent outdoor free music programming through the Cultural Trail events and neighborhood festivals.\n\nFall brings the Broad Ripple Art Fair with free music stages and the Fountain Square Festival. Winter in Indianapolis means the Circle of Lights festival at Monument Circle with free music, and the city\'s indoor bar music culture sustains free shows year-round.',
    howToFind:
      'Indy Parks lists outdoor events at indyparks.com. The Indiana State Museum occasionally hosts free outdoor concerts on its plaza. NUVO, Indianapolis\'s alt-weekly, covers free show listings comprehensively. Mass Avenue\'s First Fridays calendar is available at discovermassave.com. The Indianapolis Cultural Trail events page lists trail programming. Our listings page tracks verified free concerts across Indianapolis.',
    faqs: [
      {
        q: 'Are there free outdoor concerts in Indianapolis?',
        a: 'Yes — Indianapolis has strong free outdoor concert programming in summer. White River State Park hosts the Symphony on the Prairie series (some performances are free). Garfield Park Amphitheater hosts free community concerts. Fountain Square\'s summer concert series is free. The Cultural Trail events during neighborhood festivals include free outdoor performance. Check the IndyParks calendar for the current season\'s free concert schedule.',
      },
      {
        q: 'What is Mass Ave in Indianapolis?',
        a: 'Massachusetts Avenue ("Mass Ave") is Indianapolis\'s arts and entertainment district, a diagonal street running northeast from downtown. It\'s home to galleries, independent restaurants, theaters, and bars with a concentration of live music venues. First Fridays on Mass Ave each month feature free gallery events with live music. Several bars host free shows on weeknights, and the street hosts outdoor festivals with free music throughout the year.',
      },
      {
        q: 'Does Indianapolis have free indoor music in winter?',
        a: 'Yes — Indianapolis\'s bar and venue music culture continues year-round. Mass Ave and Fountain Square both have bars with free music on weeknights through winter. The Indianapolis Museum of Art (Newfields) hosts occasional free events. The Athenaeum and various cultural centers on the Cultural Trail host free indoor music events. The Indiana Historical Society and other institutions program free public events with music components.',
      },
    ],
  },

  cleveland: {
    slug: 'cleveland',
    code: 'CLE',
    cityName: 'Cleveland',
    state: 'OH',
    intro:
      'Cleveland has a free music culture shaped by its rock and roll history, its strong classical tradition anchored by the Cleveland Orchestra, and a revitalized urban waterfront that now hosts free outdoor concerts from spring through fall. The city that gave us rock and roll — with the Rock & Roll Hall of Fame on the lakefront — takes live music seriously as public culture, and neighborhoods like Ohio City, Tremont, and Little Italy have sustained free neighborhood music scenes through the city\'s difficult economic decades.',
    neighborhoods:
      'Downtown Cleveland and the lakefront have become the city\'s outdoor music showcase. Jacobs Pavilion at Nautica (ticketed) is the city\'s outdoor concert venue, but the adjacent Nautica entertainment complex and the lakefront park area host free events around major concerts. Voinovich Bicentennial Park on the Mall hosts free outdoor concerts and events. Public Square — recently redesigned as a public gathering space — hosts free programming throughout the year.\n\nOhio City, directly across the Cuyahoga River from downtown, is Cleveland\'s best free music neighborhood. West 25th Street and the surrounding blocks have bars and restaurants with free music several nights a week. The Ohio City Farmers Market on Saturday mornings includes live music. The Hingetown arts district within Ohio City has gallery and bar spaces with free events.\n\nTremont is Cleveland\'s artist neighborhood with a strong free music bar culture, particularly along Starkweather Avenue and Lincoln Park. The annual Tremont Arts & Cultural Festival in August is one of the city\'s best free outdoor music events. Little Italy in the University Circle area hosts the La Bella Vita festival in September with free outdoor music. The Cleveland Museum of Art in University Circle hosts free outdoor concerts and free Friday evening programs.',
    seasons:
      'Summer brings the Cleveland Orchestra\'s free outdoor Blossom concerts (some reserved seating ticketed; lawn areas sometimes free) and various lakefront events. The Cuyahoga Valley National Park near Cleveland hosts free ranger-led programs and occasional concerts. The Cleveland Museum of Art\'s Solstice concert series is one of the city\'s best free music events in June.\n\nFall brings the Tremont Arts Festival and neighborhood events. The Cleveland International Film Festival in March occasionally incorporates free music. Winter drives programming indoors but the Cleveland Orchestra occasionally offers free community performances, and Ohio City\'s bar scene continues year-round.',
    howToFind:
      'Cleveland Metroparks lists outdoor events at clevelandmetroparks.com. Cleveland Magazine and Scene Magazine cover free show listings. The Cleveland Museum of Art\'s events calendar (clevelandart.org) lists free programming. Ohio City\'s neighborhood website lists events on West 25th. The Cuyahoga Arts & Culture board lists funded arts events. Our listings page tracks verified free concerts across Cleveland.',
    faqs: [
      {
        q: 'Does the Cleveland Orchestra perform free concerts?',
        a: 'The Cleveland Orchestra\'s main Severance Hall season is ticketed, but the orchestra occasionally offers free community concerts and educational events — check their website\'s community programming section. The summer Blossom Music Festival at the Blossom Music Center in Cuyahoga Falls has a great lawn area where you can sometimes hear performances without purchasing reserved seating. The orchestra also partners with local organizations for occasional free outdoor performances.',
      },
      {
        q: 'What is the best neighborhood for free music in Cleveland?',
        a: 'Ohio City on the west side of the Cuyahoga River has the densest concentration of bars and venues with free live music in Cleveland, particularly Thursday through Saturday evenings. Tremont has strong free music bar culture. The Gordon Square Arts District on the west side has multiple venues with occasional free programming. University Circle\'s bars near Case Western and the Cleveland Institute of Music have free shows that skew toward jazz and classical.',
      },
      {
        q: 'Are there free concerts at the Cleveland Museum of Art?',
        a: 'Yes — the Cleveland Museum of Art hosts a range of free public programs including concerts, particularly in its atrium and on its outdoor plaza during summer. The Solstice concert and various Art After Dark events include free music components. General admission to the Cleveland Museum of Art is always free, making it one of the best free cultural resources in the city.',
      },
    ],
  },

  phoenix: {
    slug: 'phoenix',
    code: 'PHX',
    cityName: 'Phoenix',
    state: 'AZ',
    intro:
      'Phoenix\'s free music scene is built around its extraordinary outdoor culture and the city\'s fast-growing arts infrastructure. The desert climate means outdoor concerts are ideal from October through April — and the summer months see music move to early morning or evening hours or migrate to shaded venues. Downtown Phoenix\'s Roosevelt Row arts district, the Heard Museum\'s Native American music programming, and the City of Phoenix Parks system combine to deliver a year-round free concert calendar that has grown significantly as the city has matured.',
    neighborhoods:
      'Downtown Phoenix\'s Roosevelt Row Arts District is the city\'s free music heartland. The monthly First Friday events transform the arts district into a walkable free music zone with dozens of performances at galleries, bars, and outdoor spaces. The event runs from 6 to 10 pm on the first Friday of each month, year-round, and is entirely free. Heritage Square and the Civic Space Park nearby host various free community events with music throughout the cooler months.\n\nOld Town Scottsdale, technically a separate city but effectively an extension of Phoenix\'s cultural landscape, has free outdoor concerts at Scottsdale\'s outdoor amphitheaters and at the Old Town Farmers\' Market on Saturday mornings. The Scottsdale Arts Festival in March includes free outdoor music stages. Downtown Tempe on Mill Avenue has a bar music culture with free shows on weeknights, and Tempe Marketplace hosts free outdoor concerts regularly.\n\nThe Desert Botanical Garden hosts free outdoor events (admission required to the garden) and ticketed concert series, but the surrounding Papago Park area has free views of performances. The Heard Museum on Central Avenue hosts free Native American music performances tied to its cultural programming, offering exposure to music traditions rarely heard elsewhere. Various city parks including Steele Indian School Park host free community concerts.',
    seasons:
      'Phoenix\'s best free music season is fall through spring (October–April). First Friday in Roosevelt Row runs year-round but is most pleasant in the cool months. The Phoenix Art Museum\'s free Art After Dark events are fall through spring. The Desert Botanical Garden\'s free Butterfly Exhibit opening in spring includes music. The Scottsdale Arts Festival in March is a major free outdoor event.\n\nSummer in Phoenix means moving free music to evenings after 7 pm or to air-conditioned indoor venues. The Heard Museum hosts summer programs in its shaded courtyards. Phoenix Public Market Café on Saturday mornings has live music during the cooler morning hours even in summer.',
    howToFind:
      'Phoenix Parks and Recreation lists events at phoenix.gov. Roosevelt Row\'s website (rooseveltrow.org) lists First Friday details and monthly programming. The Phoenix New Times is the best source for free show listings citywide. Downtown Tempe\'s website lists Mill Avenue events. The Heard Museum\'s website lists all free and paid public programming. Our listings page tracks verified free concerts across the Phoenix metro.',
    faqs: [
      {
        q: 'What is First Friday in downtown Phoenix?',
        a: 'First Friday is a free monthly arts event in Phoenix\'s Roosevelt Row Arts District on the first Friday of each month, running from about 6 to 10 pm. Galleries, studios, bars, and outdoor spaces throughout the arts district host free events including live music performances. No tickets are required — just show up and walk the district. It runs year-round and is Phoenix\'s most consistent free music event.',
      },
      {
        q: 'Are there free outdoor concerts in Phoenix during summer?',
        a: 'Summer outdoor concerts in Phoenix are scheduled for evening hours (7 pm or later) when temperatures drop from daytime highs. Some venues cancel outdoor programming in July and August. First Friday events continue in summer but are more comfortable in fall and spring. Indoor free music continues year-round at bars and venues. The Heard Museum\'s courtyards host free programming in shaded, climate-moderated spaces.',
      },
      {
        q: 'Where can I hear free Native American music in Phoenix?',
        a: 'The Heard Museum on North Central Avenue is the premier venue for free Native American music and cultural programming in Phoenix. The museum hosts social dances, powwow demonstrations, and musical performances tied to its exhibitions and Native American events. The museum\'s annual World Championship Hoop Dance Contest in February includes free viewing of competitive traditional dance with musical accompaniment.',
      },
    ],
  },

  'san-diego': {
    slug: 'san-diego',
    code: 'SD',
    cityName: 'San Diego',
    state: 'CA',
    intro:
      "San Diego's ideal Mediterranean climate and deeply community-oriented parks culture make it one of the most consistent cities in the country for free outdoor music. With summer concert series running across Balboa Park, Coronado, Santee, and El Cajon simultaneously, and dozens of neighborhood parks hosting their own programs, San Diego delivers high-quality free shows from late spring through early fall with a regularity that larger cities struggle to match.",
    neighborhoods:
      "Balboa Park is the undisputed center of San Diego's free music world. The park's outdoor venues host the Twilight in the Park concert series each summer — a long-running program with Tuesday, Wednesday, and Thursday evening shows from June through August. The series draws performers across genres from folk and jazz to big band and world music, all on the park's open-air stages with no tickets or admission required.\n\nCoronado's Spreckels Park is home to the Coronado Promenade Concerts, a Sunday-evening series running from late May through early September. The intimate park setting, with the Victorian Spreckels bandshell as backdrop and neighborhood families spread across the lawn, is one of the most charming free concert settings in California. It fills up early — bring a blanket.\n\nIn the East County, El Cajon's Prescott Promenade hosts the Music on Main series on Friday evenings through summer, while Santee's Town Center Community Park East runs its own Thursday-evening program. North County communities including Carlsbad and Oceanside run their own parallel series, giving San Diego County residents multiple free concert options on any given weekend.",
    seasons:
      "The core free concert season runs from late May through early September, when every major series is active simultaneously. Twilight in the Park, the Coronado Promenade, Music on Main, and Santee's series all overlap, creating a summer calendar with multiple free options nearly every evening. June and July offer the densest scheduling.\n\nOutside summer, the Balboa Park museums host free community events with music on museum-free days (second Tuesday of each month). The year-round temperate climate means outdoor performance rarely gets weathered out, even in the off-season.",
    howToFind:
      "Balboa Park's event calendar (balboapark.org) covers Twilight in the Park and all other park programming. The City of Coronado lists Promenade concert schedules at coronado.ca.us. San Diego's Parks and Recreation department (sandiego.gov) maintains a city-wide free events calendar. The San Diego Reader publishes weekly free show guides. Our listings page tracks verified upcoming free concerts across all San Diego neighborhoods.",
    faqs: [
      {
        q: 'Is Twilight in the Park at Balboa Park really free?',
        a: "Yes — Twilight in the Park is completely free with no tickets required. The series runs Tuesday, Wednesday, and Thursday evenings from mid-June through late August on outdoor stages in Balboa Park. Just show up before the show starts (usually around 6:15 pm) and find a spot. Popular nights fill up fast, so arriving 20–30 minutes early is recommended.",
      },
      {
        q: 'What is the Coronado Promenade Concert Series?',
        a: "The Coronado Promenade Concerts are free Sunday-evening performances at Spreckels Park on the island of Coronado, running from late May through early September. The shows feature local and regional bands covering a variety of genres. Bring a blanket or low-back chair — the park fills with families and neighbors for a classic small-town concert atmosphere. No tickets, no cover, just show up.",
      },
      {
        q: 'When is the best time to catch free music in San Diego?',
        a: "June and July are the peak months, with Twilight in the Park, the Coronado Promenade, Music on Main in El Cajon, and multiple other series all running concurrently. On a typical Friday or Saturday in July you'll have three or four free concerts happening across the county simultaneously. The season winds down in late August and September as most series wrap their final shows.",
      },
    ],
  },

  'cincinnati': {
    slug: 'cincinnati',
    code: 'CIN',
    cityName: 'Cincinnati',
    state: 'OH',
    intro:
      "Cincinnati has quietly built one of the Midwest's most impressive free concert infrastructures, anchored by Fountain Square in the heart of downtown and the sprawling Smale Riverfront Park along the Ohio. The city's commitment to public music has produced a dense summer calendar with multiple simultaneous series running across neighborhoods — from downtown's iconic square to suburban park amphitheaters in Blue Ash and beyond.",
    neighborhoods:
      "Fountain Square is Cincinnati's living room and its free music anchor. The square hosts a busy schedule of free concerts throughout the warm-weather months, from lunchtime shows to evening performances, spanning genres from jazz and blues to country and pop. The square's central location in the heart of downtown makes it a natural gathering point — surrounded by restaurants and bars, it's easy to make a concert the start of an evening rather than the whole plan.\n\nSmale Riverfront Park along the Ohio River hosts two of the city's most popular summer series. The Schmidlapp Event Lawn and the Castellini Esplanade stage draw large crowds for evening shows against a backdrop of the Ohio and the Kentucky hills beyond. The setting is arguably the most scenic of any free concert venue in Cincinnati, and the park's walking paths and family-friendly amenities make it a full afternoon destination.\n\nBlue Ash, just north of the city, runs its own parallel free music infrastructure. Blue Ash Nature Park and Blue Ash Towne Square both host regular summer concert series with diverse programming. The Cincinnati Parks system also operates free concerts at venues including Beech Acres Park Amphitheater, Colerain Park Amphitheater, and the Schott Amphitheater at Sawyer Point — giving every corner of the metro its own neighborhood series.",
    seasons:
      "Cincinnati's free concert season runs from May through September, with June, July, and August being the most active months. Fountain Square programming starts as early as April for special events. The Smale Riverfront and Blue Ash series peak in midsummer. Sawyer Point and Eden Park's Seasongood Pavilion host free Cincinnati Symphony Orchestra performances in summer.\n\nWinter brings indoor free music at Cincinnati Art Museum's monthly Art After Dark events and at various neighborhood bars. The Over-the-Rhine neighborhood, Cincinnati's main music district, has multiple venues with regular free live music on weeknights throughout the year.",
    howToFind:
      "Cincinnati Parks (cincinnatiparks.com) lists all city-run concert series. Fountain Square's events calendar (myfountainsquare.com) covers downtown programming. Blue Ash's event listings are at blueash.com. The Cincinnati Enquirer and Cincinnati Magazine both publish free event guides. For the Over-the-Rhine bar music scene, CityBeat is the local go-to. Our listings page tracks verified free concerts across the Cincinnati metro.",
    faqs: [
      {
        q: 'Are the Cincinnati Symphony Orchestra outdoor concerts really free?',
        a: "Yes — the Cincinnati Symphony Orchestra and Cincinnati Pops perform free outdoor concerts in Cincinnati parks each summer, most notably at Sawyer Point and Smale Riverfront Park. These are among the most attended free events in the city. Check the CSO's website (cincinnatisymphony.org) for the specific dates each season. Bring a blanket or low chairs.",
      },
      {
        q: 'What is the best free music venue in Cincinnati?',
        a: "Smale Riverfront Park is widely considered the most beautiful setting, with Ohio River views and the Kentucky skyline as backdrop. Fountain Square is the most convenient — central, surrounded by bars and restaurants, and active from spring through fall. For neighborhood atmosphere, Hyde Park Square's summer series offers a quieter alternative.",
      },
      {
        q: 'Is there free live music in Cincinnati year-round?',
        a: "The outdoor concert series run May through September. Year-round, the Over-the-Rhine neighborhood is the best source of free live music, with bars and small venues hosting no-cover shows regularly, especially on weekday evenings. The Cincinnati Art Museum hosts free Art After Dark events monthly with live music.",
      },
    ],
  },

  'pittsburgh': {
    slug: 'pittsburgh',
    code: 'PIT',
    cityName: 'Pittsburgh',
    state: 'PA',
    intro:
      "Pittsburgh punches well above its weight for free live music, leveraging Allegheny County's extensive park system and a strong civic commitment to public arts. The county's two flagship amphitheaters — Hartwood Acres Park and South Park Amphitheater — offer full-scale concert productions at no charge, while downtown's Three Rivers Arts Festival and the Arts Landing stage bring major regional acts to the riverfront.",
    neighborhoods:
      "Hartwood Acres Park, a 629-acre estate in the North Hills, hosts one of western Pennsylvania's most beloved summer concert series. The Hartwood Acres Summer Concert Series runs on Sunday evenings from June through August, with productions ranging from classical to country to rock. The pastoral estate setting — formal gardens, a historic Tudor mansion, and rolling lawns — makes it one of the most distinctive free concert destinations in the region. Arrive early for good lawn positions.\n\nSouth Park Amphitheater in South Hills hosts another major summer series with comparable production quality and a diverse lineup. The two county park series together deliver more than 25 free concert nights per summer, often on the same Sunday.\n\nDowntown Pittsburgh's Three Rivers Arts Festival each June brings free outdoor stages and performances to Point State Park and the Cultural District. Arts Landing at the Dollar Bank Stage on the North Shore hosts free concerts on summer weekday evenings. Schenley Plaza in Oakland hosts free outdoor performances through summer, with the city skyline visible on clear days.",
    seasons:
      "June through August is Pittsburgh's prime free concert season. The Hartwood Acres and South Park series run simultaneously on Sunday evenings, and the Three Rivers Arts Festival (early June) opens the season with multiple free outdoor stages.\n\nPittsburgh's springs and falls bring occasional free outdoor events through May and September. In winter, free music retreats to indoor venues in the Strip District, Lawrenceville, and South Side — neighborhoods with active bar music scenes that feature no-cover shows on weeknights.",
    howToFind:
      "Allegheny County Parks (alleghenycounty.us/parks) lists all Hartwood Acres and South Park concert schedules. The Three Rivers Arts Festival (3riversartsfest.org) publishes its full lineup in spring. Arts Landing schedules are at pointspark.org. Pittsburgh Post-Gazette and NEXTpittsburgh publish regular free-event guides. Our listings page tracks verified upcoming free concerts across the Pittsburgh metro.",
    faqs: [
      {
        q: 'Are the Hartwood Acres concerts really free?',
        a: "Yes — the Hartwood Acres Summer Concert Series is completely free with no admission charge. Concerts are held on Sunday evenings from June through August at the outdoor amphitheater in Hartwood Acres Park (Butler Pike, Allison Park). Parking is free. The park fills up for popular performances, so arriving 45–60 minutes early to claim a good lawn spot is recommended. Bring blankets and low chairs.",
      },
      {
        q: 'What is the Three Rivers Arts Festival?',
        a: "The Three Rivers Arts Festival is Pittsburgh's largest annual arts event, held each June over ten days in downtown Pittsburgh and Point State Park. The festival features free outdoor music stages with regional and national acts alongside visual arts exhibitions, food, and craft vendors. All music performances are free. Organized by the Pittsburgh Cultural Trust.",
      },
      {
        q: 'Where do locals go for free live music in Pittsburgh?',
        a: "For outdoor summer shows, Hartwood Acres and South Park amphitheaters are the local favorites. For year-round no-cover music, Lawrenceville and the South Side have the most active bar scenes with free live music on weekend nights. The Arts Landing stage on the North Shore is a reliable summer weeknight spot close to downtown.",
      },
    ],
  },

  'san-antonio': {
    slug: 'san-antonio',
    code: 'SAT',
    cityName: 'San Antonio',
    state: 'TX',
    intro:
      "San Antonio's identity as a city defined by public space — the River Walk, historic plazas, and a year-round festival culture — makes it naturally hospitable to free live music. The Arneson River Theatre on the River Walk is one of the country's most distinctive free concert settings, with an audience seated on grass terraces across the river from a stage set into the opposite bank. San Antonio's free music scene is woven into daily life in a way that feels less like a program and more like a city tradition.",
    neighborhoods:
      "The River Walk is San Antonio's most visited corridor and its most consistent free music zone. The Arneson River Theatre, built into the riverbank at La Villita, hosts free performances on its outdoor stage throughout the year, with the audience watching from the grass steps on the opposite bank — riverboats pass behind performers mid-show. Nearby, La Villita Historic Arts Village and HemisFair Park host free music during major festivals.\n\nDowntown San Antonio's network of historic plazas supports frequent free music. Main Plaza (Plaza de las Islas) adjacent to San Fernando Cathedral stages regular free concerts, particularly during First Fridays and major city celebrations. Alamo Plaza, Milam Park, and Travis Park each host free public performances tied to city events and cultural festivals.\n\nThe Pearl District, San Antonio's fashionable mixed-use development on the northern River Walk, hosts free Saturday and Sunday farmers market music and occasional free concerts at its outdoor amphitheater space. The Wonderland of the Americas mall amphitheatre on the northwest side also hosts free community concert series.",
    seasons:
      "San Antonio's mild winters mean free outdoor music is truly a year-round proposition. The biggest free concert season is October through April, when weather is ideal. Fiesta San Antonio each April is the city's major free music blowout — a ten-day event with dozens of free outdoor stages across the city. Summer shows continue but shift to evening hours.\n\nThe holiday season brings particularly rich free programming. Fiesta de las Luminarias on the River Walk features caroling and cultural music performances on candlelit evenings each December, drawing enormous crowds.",
    howToFind:
      "The San Antonio River Authority (thesanantonioriver.org) posts River Walk event schedules. Visit San Antonio (visitsanantonio.com) maintains a comprehensive free events calendar. The San Antonio Express-News and San Antonio Current publish weekly free event guides. The City of San Antonio's Parks and Recreation calendar lists neighborhood park programming. Our listings page tracks verified upcoming free concerts across San Antonio.",
    faqs: [
      {
        q: 'What is the Arneson River Theatre and are shows free?',
        a: "The Arneson River Theatre is a historic open-air venue built directly into the San Antonio River Walk at La Villita, with a stage on one bank and tiered grass seating on the opposite bank. Many performances at the Arneson are free — particularly cultural shows, folk dance performances, and city-sponsored events. The venue is operational year-round. Check with La Villita (lavillita.com) for current free programming.",
      },
      {
        q: 'When is Fiesta San Antonio and is it free?',
        a: "Fiesta San Antonio typically takes place over ten days in late April. Many Fiesta events are free, including outdoor music stages at multiple park and plaza locations throughout the city. Some specific events require a Fiesta button (a small annual pin). The free outdoor stages are open to anyone.",
      },
      {
        q: 'Is there free music on the River Walk year-round?',
        a: "Yes — the River Walk hosts free music and cultural performances throughout the year, with the heaviest programming in spring and fall. The Arneson River Theatre stages free shows tied to city events and cultural festivals. In December, Fiesta de las Luminarias brings evening candlelight walks with free musical performances along the river.",
      },
    ],
  },

  'omaha': {
    slug: 'omaha',
    code: 'OMA',
    cityName: 'Omaha',
    state: 'NE',
    intro:
      "Omaha has developed a robust free music scene centered on its revitalized downtown parks and the Midtown Crossing district. The city's investment in public space — particularly Gene Leahy Mall's transformation and the parks along the Missouri River corridor — has created an infrastructure for free outdoor concerts that rivals much larger cities. Omaha's music community is tightly knit, with the Slowdown and Dundee neighborhood bar scene adding year-round no-cover options to the summer park calendar.",
    neighborhoods:
      "Turner Park at Midtown Crossing is Omaha's summer music hub. The park hosts multiple free concert series through the warm months, drawing neighbors from the surrounding residential streets and workers from nearby offices. The Slowdown, one of Omaha's most beloved independent music venues, is a short walk away and occasionally hosts free or low-cost shows.\n\nDowntown Omaha's Gene Leahy Mall, recently renovated, hosts free events as part of the city's downtown activation. Heartwood Park in Millard is another active free concert venue, with the Rock the C! series and other summer programming drawing families from Omaha's southwest side.\n\nThe Dundee neighborhood hosts Music in Dundee — a summer series of free outdoor concerts in the neighborhood's pocket park at 50th and Underwood. The setting is intimate and neighborhood-scaled. Miller Park on the north side runs its own summer concert series, extending free music reach across the metro.",
    seasons:
      "Omaha's free concert season runs from late May through early September, peaking in July and August. Turner Park, Heartwood Park, and the Dundee series all operate concurrently in midsummer, giving residents multiple options most weekends. The Nebraska Wind Symphony performs free outdoor concerts in summer.\n\nWinter in Omaha drives free music indoors. The Slowdown, Reverb Lounge, and O'Leaver's are the main venues for no-cover or low-cost live music through the colder months.",
    howToFind:
      "Omaha Parks and Recreation (cityofomaha.org/parks) posts city-run concert series. Midtown Crossing's website (midtowncrossing.com) lists Turner Park events. The Omaha World-Herald and Omaha Magazine publish free event roundups. For bar music, the Omaha Reader's weekly calendar is the best source. Our listings page tracks verified upcoming free concerts across the Omaha metro.",
    faqs: [
      {
        q: 'What is Music in Dundee?',
        a: "Music in Dundee is a free summer outdoor concert series held in the Dundee neighborhood's park at 50th and Underwood. The series typically runs on Thursday or Friday evenings through the summer months, featuring local and regional bands across a range of genres. The neighborhood setting is intimate and family-friendly. No tickets required.",
      },
      {
        q: 'Where do Omaha locals go for free live music?',
        a: "In summer, Turner Park at Midtown Crossing and Heartwood Park are the go-to spots for free outdoor concerts. Year-round, the Dundee neighborhood and the bars along Saddle Creek Road (The Slowdown area) have the most active no-cover music scene. O'Leaver's in Midtown and Reverb Lounge also host regular free or low-cost shows.",
      },
      {
        q: 'Are there free concerts on the Fourth of July in Omaha?',
        a: "Yes — Omaha typically hosts free outdoor music as part of Fourth of July celebrations at multiple parks across the metro, often culminating in fireworks. Gene Leahy Mall and Heartwood Park have both hosted free July 4th concerts. Check visitomaha.com in June for confirmed details.",
      },
    ],
  },

  'salt-lake-city': {
    slug: 'salt-lake-city',
    code: 'SLC',
    cityName: 'Salt Lake City',
    state: 'UT',
    intro:
      "Salt Lake City's free music scene benefits from a city government deeply invested in public programming and a community that turns out enthusiastically for outdoor events against the dramatic Wasatch Front backdrop. The Gallivan Center downtown, Liberty Park's Chase Home Museum stage, and Holladay's city hall park are the primary anchors of a summer concert calendar that gives SLC residents genuine options every week from June through August.",
    neighborhoods:
      "The Gallivan Center in downtown Salt Lake City is the city's premier free outdoor entertainment venue. The plaza hosts the Gallivan Center Concerts on Fridays, a summer series that has been running for decades and draws office workers, tourists, and locals for evening shows spanning jazz, blues, folk, and world music, with consistently high production quality.\n\nLiberty Park on the east side hosts the Chase Home Museum of Utah Folk Arts, which programs free folk music concerts and cultural performances through summer. Liberty Park itself — SLC's largest city park — is also the site of various free community concerts tied to city events, including larger performances during Pioneer Day celebrations in July.\n\nHolladay, a suburb on the east bench below the Wasatch Front, runs its own summer concert series at City Hall Park — a family-friendly weekly or biweekly program. The mountain backdrop visible from the park is among the most dramatic settings of any free concert series in Utah.",
    seasons:
      "Salt Lake City's free outdoor concert season is June through August. The Gallivan Friday concerts and the Liberty Park folk series run concurrently, giving the city consistent weekly options. July 24th (Pioneer Day) is a major Utah holiday with free outdoor music citywide.\n\nWinter concerts are sparse. The Utah Arts Festival in late June is the season opener and features free outdoor stages alongside ticketed programming.",
    howToFind:
      "The Gallivan Center (thegallivancenter.com) publishes its concert schedule in late spring. Salt Lake City Arts Council (saltlakeartscouncil.org) lists city-supported free events. Liberty Park programming is at slc.gov/parks. Holladay City Hall concert schedules are at holladaycity.com. The Salt Lake Tribune and City Weekly are the main sources for free-event guides. Our listings page tracks verified upcoming free concerts across the Salt Lake City metro.",
    faqs: [
      {
        q: 'What is the Gallivan Center Concert series?',
        a: "The Gallivan Center Concerts are free Friday-evening shows held at the Gallivan Center plaza in downtown Salt Lake City, typically running from June through August. The series features a wide range of musical genres and has been a Salt Lake City summer institution for many years. Shows start in the early evening, and the plaza fills up with lawn chairs and blankets. No tickets required.",
      },
      {
        q: 'Are there free concerts in Salt Lake City beyond downtown?',
        a: "Yes — Holladay's City Hall Park hosts a well-attended summer series in the east-bench suburbs. Liberty Park in the central city hosts folk music programming at the Chase Home Museum stage. Various neighborhood parks across the valley run summer series as part of Salt Lake County and city parks programming. The Utah Arts Festival in late June also has free outdoor stages.",
      },
      {
        q: 'When is the best time to catch free outdoor music in Salt Lake City?',
        a: "July is the peak month — the Gallivan Center, Liberty Park, and Holladay series all run simultaneously, and Pioneer Day on July 24th adds additional free programming citywide. June is also active, with the Utah Arts Festival kicking things off. The Wasatch Mountains provide a spectacular backdrop on clear evenings.",
      },
    ],
  },

  'jacksonville': {
    slug: 'jacksonville',
    code: 'JAX',
    cityName: 'Jacksonville',
    state: 'FL',
    intro:
      "Jacksonville is Florida's largest city by area, and its free music scene reflects that sprawl — spread across the Riverside arts corridor, the downtown waterfront, and Jacksonville Beach on the Atlantic coast. The city's free concert calendar peaks around the Jacksonville Jazz Festival each May, one of the largest free jazz events in the Southeast, and sustains itself through the summer with the Riverside Arts Market and beach-community series.",
    neighborhoods:
      "The Riverside neighborhood on the St. Johns River is Jacksonville's cultural core and its most reliable source of year-round free music. The Riverside Arts Market at 715 Riverside Avenue runs every Saturday morning from May through October, combining an outdoor market with live music on an open stage — one of the most pleasant free weekly music experiences in Florida.\n\nDowntown Jacksonville's waterfront has hosted the Jacksonville Jazz Festival at Ford on Bay, a May event that has drawn major jazz headliners and tens of thousands of attendees as a completely free outdoor festival. The city's Riverfront Parks system stages free music tied to major events and holiday celebrations throughout the year.\n\nJacksonville Beach, 20 miles east on the Atlantic, hosts the Seawalk Pavilion — an open-air amphitheater on the oceanfront that stages free and ticketed concerts through summer. Free beach-adjacent music events happen regularly through the warmer months, particularly tied to events like the Florida Fin Fest in September.",
    seasons:
      "Jacksonville's free concert calendar is most active from May through October, though Florida's mild winters allow for occasional year-round events. May is the marquee month thanks to the Jacksonville Jazz Festival. Summer brings the Riverside Arts Market weekly, and beach community events through August. September sees events like Florida Fin Fest at Seawalk Pavilion.\n\nWinter free music in Jacksonville leans toward bars and smaller venues in Riverside and Five Points. The Riverside Ave corridor and King Street in Avondale have consistent no-cover music at bars on weekends.",
    howToFind:
      "The Jacksonville Jazz Festival (jaxjazzfest.com) publishes lineup details in March–April. The Riverside Arts Market (riversideartsmarket.com) lists weekly music performers on their site and social media. Visit Jacksonville (visitjacksonville.com) maintains a comprehensive free events guide. The Florida Times-Union and Folio Weekly cover free shows across the city. Our listings page tracks verified upcoming free concerts across Jacksonville.",
    faqs: [
      {
        q: 'Is the Jacksonville Jazz Festival really free?',
        a: "Yes — the Jacksonville Jazz Festival is one of the largest free jazz festivals in the southeastern United States, typically held over multiple days in May at venues along the downtown waterfront. All performances are free and open to the public. The festival has featured Grammy-winning artists and major jazz headliners. Check jaxjazzfest.com each spring for exact dates and lineup.",
      },
      {
        q: 'What is the Riverside Arts Market?',
        a: "The Riverside Arts Market is a weekly Saturday outdoor market along the river at 715 Riverside Ave in the Riverside neighborhood, featuring local artists, produce, food vendors, and live music. The market runs from roughly May through October on Saturday mornings. Admission is free, and the live music is consistently good — local and regional acts cover everything from folk and jazz to indie and world music.",
      },
      {
        q: 'Where can I find free live music at Jacksonville Beach?',
        a: "The Seawalk Pavilion in Jacksonville Beach is the main outdoor venue, hosting both free and ticketed shows on the oceanfront. Free community events and beach festivals tied to the pavilion happen through summer and fall. The beach's bar scene along 1st Street North and Beach Blvd has no-cover live music on weekend nights at bars and restaurants year-round.",
      },
    ],
  },

  'baltimore': {
    slug: 'baltimore',
    code: 'BAL',
    cityName: 'Baltimore',
    state: 'MD',
    intro:
      "Baltimore's free music scene draws on a rich tradition of neighborhood programming and public arts investment, with Patterson Park, Canton Waterfront, and the Inner Harbor area serving as the geographic anchors. The city's summer concert calendar is filled by a network of neighborhood series — from the Patterson Park Observatory to Belvedere Square Market in North Baltimore — that give each corner of the city its own musical identity. Artscape, Baltimore's massive annual free arts festival, is the headline event.",
    neighborhoods:
      "Patterson Park in East Baltimore is home to one of the city's most beloved summer series, held on the hill below the historic Park Observatory. The concerts draw a mix of park regulars and music lovers from across the east side for evening shows spanning genres from bluegrass and jazz to contemporary folk and world music.\n\nCanton Waterfront Park hosts WTMD's First Thursday concert series, a monthly free outdoor concert from June through September on the waterfront. WTMD (89.7 FM) is Baltimore's independent public radio station, and its First Thursday series reflects the station's musical sensibility — eclectic, high-quality, and free. The waterfront setting with views of the harbor makes it one of the most atmospheric free music experiences in the city.\n\nBelvedere Square Market in North Baltimore runs free summer concerts at its outdoor market space — a local favorite for families in the Roland Park and Govans areas. Downtown, Artscape (typically in July near Mount Royal) is the city's largest free arts festival, transforming the area around the Maryland Institute College of Art into a free outdoor music zone for three days, with multiple stages and national acts.",
    seasons:
      "Baltimore's free concert season runs from late May through September, with Artscape in July as the year's signature event. The Patterson Park series, WTMD First Thursdays, and Belvedere Square run concurrently through summer.\n\nFall and winter see free music move indoors. The Charles Village and Station North neighborhoods have the most active bar-music scenes with no-cover shows on weekends. The Ottobar, Sidebar, and various bars along Charles Street host free or very low-cost shows regularly through the colder months.",
    howToFind:
      "Baltimore City Recreation and Parks (bcrp.baltimorecity.gov) lists city-run free events. WTMD's First Thursday schedule is at wtmd.org. Artscape information is at artscape.org. The Baltimore Banner and Baltimore Fishbowl publish free event calendars. For bar and club free shows, Baltimore Beat is the essential guide. Our listings page tracks verified upcoming free concerts across Baltimore.",
    faqs: [
      {
        q: 'What is Artscape in Baltimore and is it free?',
        a: "Artscape is one of the largest free arts festivals in the United States, typically held over three days in mid-July in the arts district near the Maryland Institute College of Art on Mount Royal Ave. The festival is completely free and open to the public, featuring multiple outdoor music stages with regional and national acts, visual art exhibitions, and food vendors. No tickets or wristbands required.",
      },
      {
        q: 'What is the WTMD First Thursday concert series?',
        a: "WTMD First Thursdays are free monthly outdoor concerts held at Canton Waterfront Park from June through September, produced by Baltimore's independent public radio station WTMD (89.7 FM). Shows feature local, regional, and national artists across indie, folk, Americana, and alternative genres. Concerts run from approximately 5 to 8 pm. Bring a lawn chair or blanket. No tickets required.",
      },
      {
        q: 'Where is the best neighborhood for free live music in Baltimore?',
        a: "For summer outdoor concerts, the Patterson Park area, Canton Waterfront, and Belvedere Square each offer distinct neighborhood vibes. For year-round no-cover bar music, Station North and Charles Village are the most active. The Ottobar on Howard Street hosts regular free or low-cost shows. The Federal Hill neighborhood around Cross Street Market also has bars with regular live music.",
      },
    ],
  },
}

export const GUIDE_SLUGS = Object.keys(CITY_GUIDES)
