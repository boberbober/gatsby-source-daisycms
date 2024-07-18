
import fetchDaisy from './fetchDaisy.mjs'


export default async function sourceNodes({
	reporter, 
	actions: { createNode }, 
	createContentDigest, 
}) {

	reporter.info("DaisyCMS: sourceNodes")

	const data = await fetchDaisy(`
		query EntriesDump {
			entries
			files
		}
	`)

	reporter.info(`Fetched ${data.entries.length} entries, and ${data.files.length} files.`)

	for (const entry of data.entries) {
		const node = {
			...entry.values,
			internal: {
				type: entry.typeName,
				contentDigest: createContentDigest(entry.values),
			},
		}
		createNode(node)
	}

	for (const file of data.files) {
				
		createNode({
			...file,
			remoteFileId: `remote:${file.path}`,
			id: file.path,
			internal: {
				type: 'DaisyFile',
				contentDigest: createContentDigest(file),
			},
		})
	}
}