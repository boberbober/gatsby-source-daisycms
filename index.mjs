
// import { Link } from 'gatsby'
// import parse, { attributesToProps, domToReact } from 'html-react-parser'
// import { GatsbyImage, getImage } from 'gatsby-plugin-image'
// import cn from 'classnames'


// function HtmlRenderer({ html }) {

// 	const htmlString = html?.raw || html?.rawWithAnchors || html || ''

// 	const parserOptions = {
// 		replace: node => {
// 			// Links
// 			if (node.name === 'a') {
// 				if (node.attribs.href?.startsWith('/')) {
// 					const attrs = {
// 						...attributesToProps(node.attribs),
// 						to: node.attribs.href
// 					}
// 					return <Link {...attrs}>{domToReact(node.children, parserOptions)}</Link>
// 				} else {
// 					const attrs = {
// 						...attributesToProps(node.attribs),
// 						rel: 'noopener noreferrer',
// 						nofollow: 'true',
// 					}
// 					return <a {...attrs}>{domToReact(node.children, parserOptions)}</a>
// 				}
// 			// Images
// 			} else if (node.name === 'img' && node.attribs.src?.startsWith('/')) {
// 				const attrs = {
// 					// ...attributesToProps(node.attribs),
// 					alt: node.attribs.alt || '',
// 					className: cn(`html-image`, node.attribs.class),
// 				}
// 				const file = html.files.find(file => file.id === node.attribs.src)
// 				if (!file) return;
// 				return <GatsbyImage 
// 					image={getImage(file.remoteFile.childImageSharp)} 
// 					loading='lazy' 
// 					{...attrs} 
// 				/>
	
// 			}
// 		}
// 	}

// 	return parse(htmlString, parserOptions)
// }

// export { HtmlRenderer }