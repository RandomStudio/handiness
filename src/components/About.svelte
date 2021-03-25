<section class="about">
	<section class="about-content">
		<div class="about-text">
			<p class="underline">About</p>
			This small project is a playful research into what can be achieved with realtime hand/finger gesture recognition in
			the Web Browser.
			<br /><br />

			<p class="underline">Techie Stuff</p>

			We decided to try using Google’s Mediapipe as a way to preprocess two datasets of images containing people and
			detect hand positions within those images. Afterwards we used the coordinates of keypoints in those hands to
			compare to the hand position/direction of the user using the VPTREE algorithm. Additionally we have added the
			functionality to preview these images using our in-house created image compression system, you can read more about
			it here.
			<br /><br />

			<p class="underline">Stats</p>
			6000 images from the COCO dataset 3000 images from the MPII dataset
			<br /><br />

			<p class="underline">References</p>
			COCO Dataset MPII Dataset VPTREE algorithm
		</div>
		<div class="about-social">
			<ul>
				<li><a href="mailto:hello@random.studio">CONTACT</a></li>
				<li><a href="https://www.instagram.com/random_studio/">INSTAGRAM</a></li>
				<li><a href="https://medium.com/random-studio">MEDIUM</a></li>
			</ul>
		</div>
	</section>
</section>

<style lang="scss">
	.about {
		top: 0;
		width: 100%;
		height: 100%;
		backdrop-filter: blur(32px);
		z-index: 9;
		position: absolute;
	}
	.about-content {
		display: grid;
		grid-template-columns: 75% 25%;
		margin-left: auto;
		margin-right: auto;
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 75%;
		text-shadow: 0px 1px 6px black;
	}

	.about-text {
		color: white;
		border-right: 2px solid white;
		padding-right: 30px;
	}
	.about-social {
		ul {
			list-style: none;
			font-size: 20px;
			text-decoration: none;
			li > a {
				text-decoration: none;
				color: white;
			}
		}
	}

	.underline {
		text-decoration: underline;
	}
</style>
