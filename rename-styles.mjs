import { existsSync, renameSync } from "fs";

export const renameStyles = {
	name: "rename-styles",
	setup(build) {
		build.onEnd(() => {
			const { outfile } = build.initialOptions;
			const outcss = outfile.replace(/\.js$/, ".css");
			const fixcss = outfile.replace(/main\.js$/, "styles.css");
			if (existsSync(outcss)) {
				console.log("Renaming", outcss, "to", fixcss);
				renameSync(outcss, fixcss);
			}
		});
	},
};
