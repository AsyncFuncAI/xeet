use xeet_core::{model::{Post, RenderOptions, Theme}, render};
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let post = Post {
        platform: "threads".into(),
        text: "One engine, five platforms.".into(),
        ..Default::default()
    };
    let options = RenderOptions { width: 600.0, theme: Theme::Dark, dpr: 2.0, ..Default::default() };
    let (png, report) = render::render(&post, &options)?;
    std::fs::write("rust-post.png", png)?;
    println!("{} × {}", report.size.width, report.size.height);
    Ok(())
}
