<script>
	export let handleStartVideo;
</script>

<section>
	<h2>Intro</h2>
	<p>Could be some text and a gif showing the motions</p>
	<p>And also asking for camera access</p>

	<button on:click={handleStartVideo}>START</button>
	<!-- <div>Loader - show if all approved but still loading</div> -->
</section>

<style>
	section {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}
</style>