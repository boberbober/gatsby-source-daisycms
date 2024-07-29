
import { JSDOM } from 'jsdom'

import fetchDaisy from './fetchDaisy.mjs'


export default async function createSchemaCustomization({ 
	actions: { createTypes }, 
	schema: { buildObjectType },
	reporter,
}) {

	reporter.info("Daisy CMS: createSchemaCustomization")
	
	const typeDefs = []

	typeDefs.push(`type DaisyFile implements Node {
		id: ID!
		url: String!
		path: String!
		created: Date
		modified: Date
		mimeType: String,
		filename: String,
		filesize: Int,
		remoteFileId: ID,
		remoteFile: File @link(from: "remoteFileId")
	}`)

	typeDefs.push(`
		interface PageEntry implements Node {
			id: ID! 
			uri: URI
			title: String
			description: String
			label: String
			modified: Date
		}
	`)

	typeDefs.push(buildObjectType({
		name: 'URI',
		fields: {
			prefix: 'String',
			uri: 'String',
			url: 'String',
			slug: 'String',
		}
	}))

	typeDefs.push(buildObjectType({
		name: 'HTML',
		fields: {
			raw: {
				type: 'String',
				resolve: source => source || null,
			},
			rawWithAnchors: {
				type: 'String',
				resolve: source => {
					// add id attribute forEach <h1>, <h2>, <h3> tags
					if (!source) return null
					const dom = new JSDOM(source)
					const document = dom.window.document
					const elements = document.querySelectorAll(['h1', 'h2', 'h3'])
					elements.forEach(element => {
						const id = formatAnchorId(element.textContent)
						element.setAttribute('id', id)
					})
					return dom.window.document.body.innerHTML
				}
			},
			headers: {
				type: '[JSON]',
				resolve: source => {
					// return an array of headers with level, text and id, for table of contents, in order of appearance
					if (!source) return null
					const dom = new JSDOM(source)
					const document = dom.window.document
					const headers = []
					const elements = document.querySelectorAll(['h1', 'h2', 'h3'])
					elements.forEach(element => headers.push({
						level: element.tagName.replace('H', ''),
						text: element.textContent,
						id: formatAnchorId(element.textContent)
					}))
					return headers.length > 0 ? headers : null
				}
			},
			files: {
				type: '[DaisyFile]',
				resolve: async (source, _, { nodeModel }) => {
					const srcs = new Set()
					const frag = JSDOM.fragment(source)
					const elements = frag.querySelectorAll(['img'])
					elements.forEach(element => srcs.add(element.src))
					const imgSrcs = Array.from(srcs)
					if (!imgSrcs.length) 
						return []
					const files = nodeModel.getNodesByIds({ ids: imgSrcs, type: 'DaisyFile' })
					return files
				}
			}
		}
	}))

	// Fetch schema from CMS

	const data = await fetchDaisy(`
		query EntriesObjectTypes {
			entriesObjectTypes
		}
	`)

	for (const objectType of data?.entriesObjectTypes) {

		const typeDef = {
			name: objectType.name,
			fields: {},
			interfaces: objectType.isNode ? ['Node'] : [],
			extensions: { infer: false },
		}
		let hasUriField = false

		for (const field of objectType.fields) {

			const typeName = field.multi ? `[${field.gqlType}]` : field.gqlType

			if (field.type === 'REFERENCE') {
				typeDef.fields[field.id] = {
					type: typeName,
					resolve: getReferenceFieldResolver(field)
				}
			} else if (field.type === 'FILE') {
				typeDef.fields[field.id] = {
					type: 'DaisyFile',
					resolve: async (source, _, { nodeModel }) => {
						const file = await nodeModel.getNodeById({ 
							id: source[field.id],
							type: 'DaisyFile',
						})
						return file
					}
				}
			} else {
				typeDef.fields[field.id] = typeName
			}
			if (field.type === 'URI') hasUriField = true
		}

		if (hasUriField && !typeDef.interfaces.includes('Redirect')) {
			typeDef.interfaces.push('PageEntry')
			typeDef.fields['breadcrumbs'] = {
				type: '[PageEntry]',
				resolve: breadcrumbsResolver,
			}
			typeDef.fields['categoryPages'] = {
				type: '[InfoPages]',
				resolve: categoryPagesResolver,
			}
			for (const field of ['title', 'description', 'label'])
				if (!typeDef.fields[field]) typeDef.fields[field] = 'String'
		}

		typeDefs.push(buildObjectType(typeDef))
	}

	createTypes(typeDefs)
}


function getReferenceFieldResolver(field) {
	return function(source, args, context, info) {
		if (!!field.multi) {
			if (!Array.isArray(source[field.id])) return []
			return context.nodeModel.getNodesByIds({
				ids: source[field.id].map(id => `${field.gqlType}_${id}`),
				type: field.gqlType,
			})
		}
		if (!source[field.id]) return null
		return context.nodeModel.getNodeById({
			id: `${field.gqlType}_${source[field.id]}`,
			type: field.gqlType,
		})
	}
}

async function breadcrumbsResolver(source, args, { nodeModel }) {
	const url = source.uri.url.split('/').slice(1, -2)
	const urls = []
	for (let i = url.length; i > 0; i--) 
		urls.push(`/${url.slice(0, i).join('/')}/`)
	const gatsbyNodes = await nodeModel.findAll({
		type: 'PageEntry',
		query: { filter: { uri: { url: { in: urls } } } }
	})
	const nodes = Array.from(gatsbyNodes.entries)
	return nodes.sort((a, b) => urls.indexOf(b.uri.url) - urls.indexOf(a.uri.url))
}

async function categoryPagesResolver(source, args, { nodeModel }) {
	const slugs = source.uri.url.split('/')
	const mainSlug = slugs[1]
	const nodes = await nodeModel.findAll({
		type: 'InfoPages',
		query: { filter: { 
			uri: { url: { regex: `^/${mainSlug}/` } },
			id: { ne: source.id }, 
		} }
	})
	return nodes.entries.map(node => node)
}


function formatAnchorId(text) {
	return text
		.trim()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/\s/g, '-')
		// .toLowerCase()
		.replace(/[^A-Za-z0-9\-]/g, '')
		.replace(/\-+/g, '-')
}
