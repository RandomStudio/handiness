<script>
	import { fade } from 'svelte/transition';
</script>

<section transition:fade={{ duration: 150 }} class="about">
	<section class="about-content">
		<div class="about-text">
			<p>Body language communicates and your hand gestures speak for you</p>
			<br />

			<p>
				<a href="https://random.studio" class="underline"> Random Studio 2021 </a>
			</p>
			<br />

			<p>
				Technology used: <br />
				<a href="https://mediapipe.dev/">Mediapipe</a> <br />
				<a href="https://github.com/fpirsch/vptree.js">VPTREE algorithm</a><br />
				<a href="https://cocodataset.org/">COCO dataset</a><br />
				<a href="http://human-pose.mpi-inf.mpg.de/">MPII dataset</a><br />
				<a href="https://medium.com/random-studio/creative-compression-18179149f19d"
					>Random Studio's Creative Compression</a
				>
			</p>
			<br />
		</div>
	</section>
</section>

<style lang="scss">
	a {
		text-decoration: underline;
		color: var(--color-white);
	}

	.underline {
		border-top: 2px solid var(--color-white);
		border-bottom: 2px solid var(--color-white);
		padding: 10px 0 10px;
		text-decoration: none;
	}
	.about {
		position: absolute;
		top: 0;
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		padding: 8vh 2rem 0;
		font-size: var(--font-small);
		color: var(--color-white);

		z-index: 9;
		overflow: hidden scroll;

		/* Hide scrollbar for IE, Edge and Firefox */
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */

		/* Hide scrollbar for Chrome, Safari and Opera */
		&::-webkit-scrollbar {
			display: none;
		}

		&::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			z-index: -1;

			box-shadow: inset 0 0 20rem 0 rgba(255, 255, 255, 0.5);
			background-color: rgba(0, 0, 0, 0.85);
			filter: blur(32px);
		}

		@supports (backdrop-filter: none) {
			backdrop-filter: blur(32px);

			&::before {
				display: none;
			}
		}

		@media all and (min-width: 600px) {
			padding: 0;
			font-size: var(--font-normal);
		}
	}

	.about-content {
		max-width: 56rem;

		::-moz-selection {
			/* Code for Firefox */
			color: red;
			background: yellow;
		}

		::selection {
			color: red;
			background: yellow;
		}

		@media all and (min-width: 600px) {
			display: flex;
			margin: auto;
			padding: 0 24px;
			width: 100%;
		}
	}

	.about-text {
		display: inline-block;
		/* border-bottom: 2px solid var(--color-white); */
		padding-bottom: 1rem;

		@media all and (min-width: 600px) {
			border-bottom: none;
			padding-right: 24px;
			width: 100%;
		}
	}
</style>
