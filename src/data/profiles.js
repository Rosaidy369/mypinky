const profiles = [
  {
    id: 1,
    name: "Lauren",
    age: 23,
    country: "Madrid",
    gender: "Mujer",
    distance: 3,
    online: true,
    premium: true,
    mood: "💬 Quiero conversar",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600",
    photos: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600",
      "https://images.unsplash.com/photo-1541823709867-1b206113eafd?w=600",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600"
    ],
    bio: "Me gusta conocer personas interesantes y hablar de cualquier tema.",
    interests: ["☕ Café", "🎵 Música", "✈️ Viajar", "🎬 Películas", "🐶 Perros"],
    prompts: [
      { question: "Mi cita ideal sería...", answer: "Un café por la tarde y hablar hasta que cierren el lugar." },
      { question: "No puedo vivir sin...", answer: "Mi playlist de viajes y un buen café." }
    ]
  },
  {
    id: 2,
    name: "Emily",
    age: 25,
    country: "Miami",
    gender: "Mujer",
    distance: 8,
    online: true,
    premium: false,
    mood: "😂 Quiero reír",
    image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600",
    photos: [
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600",
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600"
    ],
    bio: "Fanática del cine, la playa y las conversaciones largas.",
    interests: ["🎬 Cine", "🏖 Playa", "🍕 Pizza", "📸 Fotografía"],
    prompts: [
      { question: "Un dato curioso sobre mí...", answer: "He visto más de 500 películas registradas en mi app." },
      { question: "La forma más rápida de conquistarme es...", answer: "Invitarme pizza y una buena peli." }
    ]
  },
  {
    id: 3,
    name: "Sophia",
    age: 22,
    country: "Londres",
    gender: "Mujer",
    distance: 15,
    online: false,
    premium: true,
    mood: "🌙 No puedo dormir",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600",
    photos: [
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600"
    ],
    bio: "Siempre hay tiempo para una buena conversación.",
    interests: ["📚 Lectura", "🌙 Noches de peli", "☕ Café", "🎨 Arte"],
    prompts: [
      { question: "Mi libro favorito es...", answer: "Cualquier cosa de misterio, me encantan los giros inesperados." },
      { question: "Estoy buscando...", answer: "Alguien con quien quedarme hablando hasta tarde sin darme cuenta." }
    ]
  },
  {
    id: 4,
    name: "Emma",
    age: 24,
    country: "París",
    gender: "Mujer",
    distance: 22,
    online: true,
    premium: false,
    mood: "☕ Busco compañía",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600",
    photos: [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600",
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600",
      "https://images.unsplash.com/photo-1541823709867-1b206113eafd?w=600"
    ],
    bio: "Amante del café, los viajes y la música.",
    interests: ["✈️ Viajar", "🎵 Música", "☕ Café", "🥐 Repostería"],
    prompts: [
      { question: "Mi próximo destino soñado es...", answer: "Japón, quiero ver los cerezos en flor." },
      { question: "Algo que la gente no sabe de mí...", answer: "Hago repostería casera casi todos los domingos." }
    ]
  }
];

export default profiles;