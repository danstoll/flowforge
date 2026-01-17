const services = [
  {
    name: 'Crypto Service',
    description: 'Hashing, encryption, decryption, key generation',
    language: 'Node.js',
    endpoints: ['/hash', '/encrypt', '/decrypt', '/key'],
  },
  {
    name: 'Math Service',
    description: 'Mathematical calculations, statistics, matrix operations',
    language: 'Python',
    endpoints: ['/calculate', '/statistics', '/matrix'],
  },
  {
    name: 'PDF Service',
    description: 'Generate, merge, split, extract text from PDFs',
    language: 'Node.js',
    endpoints: ['/generate', '/merge', '/split', '/extract-text'],
  },
  {
    name: 'OCR Service',
    description: 'Extract text from images',
    language: 'Python',
    endpoints: ['/extract', '/languages'],
  },
  {
    name: 'Image Service',
    description: 'Resize, convert, optimize images',
    language: 'Node.js',
    endpoints: ['/resize', '/convert', '/optimize'],
  },
  {
    name: 'LLM Service',
    description: 'Chat completions and embeddings',
    language: 'Python',
    endpoints: ['/chat', '/embeddings', '/models'],
  },
  {
    name: 'Vector Service',
    description: 'Vector similarity search',
    language: 'Python',
    endpoints: ['/collections', '/upsert', '/search'],
  },
  {
    name: 'Data Transform',
    description: 'JSON/XML/CSV transformations',
    language: 'Node.js',
    endpoints: ['/transform', '/convert', '/validate'],
  },
];

export default function Services() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Services Catalog</h1>
      <div className="space-y-4">
        {services.map((service) => (
          <div key={service.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold">{service.name}</h3>
                <p className="text-gray-600">{service.description}</p>
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                {service.language}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {service.endpoints.map((ep) => (
                <code key={ep} className="px-2 py-1 bg-gray-100 rounded text-sm">
                  {ep}
                </code>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
