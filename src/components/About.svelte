<script>
	import { fade } from 'svelte/transition';
</script>

<section transition:fade={{ duration: 150 }} class="about">
	<section class="about-content">
		<div class="about-text">
			<p><u>About</u></p>
			<p>
				This small project is a playful research into what can be achieved with realtime hand/finger gesture recognition
				in the Web Browser.
			</p>
			<br />

			<p><u>Techie Stuff</u></p>
			<p>
				We decided to try using Google’s Mediapipe as a way to preprocess two datasets of images containing people and
				detect hand positions within those images. Afterwards we used the coordinates of keypoints in those hands to
				compare to the hand position/direction of the user using the VPTREE algorithm. Additionally we have added the
				functionality to preview these images using our in-house created image compression system, you can read more
				about it here.
			</p>
			<br />

			<p><u>Stats</u></p>
			<p>6000 images from the COCO dataset 3000 images from the MPII dataset</p>
			<br />

			<p><u>References</u></p>
			<p>COCO Dataset MPII Dataset VPTREE algorithm</p>
		</div>
		<div class="about-social">
			<ul>
				<li><a href="mailto:hello@random.studio">CONTACT</a></li>
				<li><a href="https://www.instagram.com/random_studio/">INSTAGRAM</a></li>
			</ul>
		</div>
	</section>
</section>

<style lang="scss">
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
		backdrop-filter: blur(32px);
		overflow: hidden scroll;

		/* Hide scrollbar for IE, Edge and Firefox */
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */

		/* Hide scrollbar for Chrome, Safari and Opera */
		&::-webkit-scrollbar {
			display: none;
		}

		@media all and (min-width: 480px) {
			padding: 18vh 24px 0;
			font-size: var(--font-normal);
		}
	}
	.about-content {
		max-width: 64rem;
		@media all and (min-width: 480px) {
			display: flex;
			margin: 0 auto;
			width: 100%;
		}
	}

	.about-text {
		display: inline-block;
		border-bottom: 2px solid var(--color-white);
		padding-bottom: 1rem;

		@media all and (min-width: 480px) {
			border-bottom: none;
			border-right: 2px solid var(--color-white);
			padding-right: 2.4rem;
			width: 75%;
		}
	}
	.about-social {
		ul {
			padding: 0;
			list-style: none;
			font-size: var(--font-medium);
			text-decoration: none;
			li > a {
				text-decoration: none;
				color: var(--color-white);
			}
		}

		@media all and (min-width: 480px) {
			width: 25%;

			ul {
				font-size: var(--font-medium);
				padding: 0 0 0 2.4rem;
			}
		}
	}

	.underline {
		text-decoration: underline;
	}
</style>
