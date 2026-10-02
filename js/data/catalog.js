const songs = [
  ['Luces de ciudad', 'Luna Norte', 'Después de las diez', 'Indie', 218, 'Colombia', 'orbit', 890, 0.01],
  ['Otra órbita', 'Luna Norte', 'Después de las diez', 'Indie', 193, 'Colombia', 'orbit', 710, 0.012],
  ['Todo vuelve', 'Mar Abierto', 'Marea', 'Pop', 204, 'México', 'tide', 980, 0.01],
  ['Azul profundo', 'Mar Abierto', 'Marea', 'Pop', 236, 'México', 'tide', 640, 0.01],
  ['La última estación', 'Los Días', 'Kilómetros', 'Rock', 267, 'Argentina', 'sunset', 840, 0.015],
  ['Cerca del sol', 'Los Días', 'Kilómetros', 'Rock', 241, 'Argentina', 'sunset', 690, 0.015],
  ['Café a medianoche', 'Elena Sol', 'Pequeñas cosas', 'Jazz', 315, 'España', 'bloom', 490, 0.008],
  ['Domingo lento', 'Elena Sol', 'Pequeñas cosas', 'Jazz', 282, 'España', 'bloom', 410, 0.008],
  ['Baila conmigo', 'Río Tropical', 'Verano eterno', 'Latino', 187, 'Colombia', 'sunset', 1200, 0.01],
  ['Sin prisa', 'Río Tropical', 'Verano eterno', 'Latino', 211, 'Colombia', 'sunset', 920, 0.01],
  ['Frecuencia 01', 'Neón Sur', 'Circuitos', 'Electrónica', 302, 'Chile', 'orbit', 730, 0.009],
  ['Pulso', 'Neón Sur', 'Circuitos', 'Electrónica', 254, 'Chile', 'orbit', 560, 0.009],
  ['Carta sin enviar', 'Sofía Alba', 'De papel', 'Acústico', 229, 'México', 'bloom', 680, 0.011],
  ['Un lugar aquí', 'Sofía Alba', 'De papel', 'Acústico', 198, 'México', 'bloom', 530, 0.011],
  ['Horizontes', 'Atlas Interior', 'El viaje', 'Indie', 248, 'Chile', 'tide', 810, 0.012],
  ['Nubes de abril', 'Atlas Interior', 'El viaje', 'Indie', 222, 'Chile', 'tide', 590, 0.012],
  ['Paso a paso', 'Brisa', 'Primavera', 'Pop', 179, 'España', 'bloom', 960, 0.01],
  ['Días mejores', 'Brisa', 'Primavera', 'Pop', 206, 'España', 'sunset', 770, 0.01],
];

export const initialCatalog = [
  ...songs.map(([title, artist, album, genre, duration, region, cover, popularity, royaltyRate], index) => ({
    id: `music-${index + 1}`, type: 'music', title, creator: artist, artist, album, genre, category: genre, duration, region,
    cover: `assets/images/albums/${cover}.svg`, popularity, royaltyRate, enabled: true,
  })),
  ...[
    ['Ideas en voz alta', 'Clara Montes', 'Cultura', 'El arte de escuchar', 1860, 'Colombia', 660],
    ['Código humano', 'Tomás Vega', 'Tecnología', 'Tecnología que nos conecta', 2400, 'México', 870],
    ['Kilómetro cero', 'Ana Rojas', 'Viajes', 'Una ciudad, mil historias', 1620, 'Argentina', 420],
    ['Respira un momento', 'Lucía Paz', 'Bienestar', 'Volver al presente', 1080, 'Chile', 780],
    ['Ciencia cotidiana', 'Nicolás Serra', 'Ciencia', 'El sonido del universo', 2100, 'España', 730],
  ].map(([title, creator, category, episode, duration, region, popularity], index) => ({
    id: `podcast-${index + 1}`, type: 'podcast', title, creator, author: creator, category, genre: '', episode, album: '', duration, region,
    cover: `assets/images/podcasts/${index % 2 ? 'signals' : 'conversations'}.svg`, popularity, royaltyRate: 0, enabled: true,
  })),
  ...[
    ['El mapa de los días', 'Isabel Fuentes', 'Ficción', 14400, 'Colombia', 520],
    ['Hábitos pequeños', 'Mateo León', 'Desarrollo personal', 10800, 'México', 820],
    ['La ciudad invisible', 'Julia Rivas', 'Ficción', 18000, 'Argentina', 670],
    ['Bosques del mañana', 'Andrés Vidal', 'Naturaleza', 12600, 'Chile', 430],
    ['Una breve historia del tiempo libre', 'Eva Molina', 'Historia', 16200, 'España', 610],
  ].map(([title, creator, category, duration, region, popularity], index) => ({
    id: `audiobook-${index + 1}`, type: 'audiobook', title, creator, author: creator, category, genre: '', album: '', duration, region,
    cover: `assets/images/audiobooks/${index % 2 ? 'landscape' : 'pages'}.svg`, popularity, royaltyRate: 0, enabled: true,
  })),
];
