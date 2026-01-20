import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { changelog, changeTypeColors } from '../data/changelog.js';

interface VersionParams {
  version: string;
}

export async function changelogRoutes(fastify: FastifyInstance) {
  // Get full changelog
  fastify.get('/api/v1/changelog', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      changelog,
      changeTypeColors,
      latestVersion: changelog[0]?.version || null,
    });
  });

  // Get specific version
  fastify.get<{ Params: VersionParams }>(
    '/api/v1/changelog/:version',
    async (request: FastifyRequest<{ Params: VersionParams }>, reply: FastifyReply) => {
      const { version } = request.params;
      const release = changelog.find(r => r.version === version);

      if (!release) {
        return reply.status(404).send({
          error: 'Version not found',
          availableVersions: changelog.map(r => r.version),
        });
      }

      return reply.send(release);
    }
  );

  // Get latest version only
  fastify.get('/api/v1/changelog/latest', async (request: FastifyRequest, reply: FastifyReply) => {
    const latest = changelog[0];
    if (!latest) {
      return reply.status(404).send({ error: 'No releases found' });
    }
    return reply.send(latest);
  });
}
