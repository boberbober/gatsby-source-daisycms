
import 'dotenv/config'
import { createRemoteFileNode } from 'gatsby-source-filesystem'

// Check this: 
// https://github.com/graysonhicks/gatsby-plugin-remote-images/blob/master/src/gatsby-node.js
// https://www.gatsbyjs.com/docs/how-to/images-and-media/preprocessing-external-images/


export default async function onCreateNode(
	{	node,
		actions: { createNode, createNodeField},
		// createNodeId,
		getCache,
	},
) {

    const token = process.env.DAISY_CMS_TOKEN

	if (node.internal.type === 'DaisyFile') {

		await createRemoteFileNode({
			url: node.url, // string that points to the URL of the image
			parentNodeId: node.id, // id of the parent node of the fileNode you are going to create
			createNode, // helper function in gatsby-node to generate the node
			createNodeId: () => node.remoteFileId, // helper function in gatsby-node to generate the node id
			getCache,
			httpHeaders: {
				'Authorization': `Bearer ${token}`
			},
		})
	}
}
